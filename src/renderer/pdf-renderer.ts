import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';

// Simple renderer that works with the JSON spec
export class PDFRenderer {
  static async render(spec: any): Promise<Buffer> {
    try {
      // Validate the spec
      const document = DocumentSchema.parse(spec);
      
      // Create React PDF component from spec
      const PdfDocument = this.createPdfComponent(document);
      
      // Generate PDF
      const instance = pdf(PdfDocument as any);
      const stream = await instance.toBuffer();
      
      return stream;
      
    } catch (error: any) {
      throw new Error('PDF rendering failed: ' + error.message);
    }
  }
  
  private static createPdfComponent(spec: any): any {
    const { type, props, children } = spec;
    
    switch (type) {
      case 'Document':
        return (
          <Document>
            {children && children.map((child: any, index: number) => 
              this.createPdfComponent({ ...child, key: index })
            )}
          </Document>
        );
        
      case 'Page':
        return (
          <Page 
            size={props.size || 'A4'}
            orientation={props.orientation || 'portrait'}
            style={props.style}
            key={spec.key}
          >
            {children && children.map((child: any, index: number) => 
              this.createPdfComponent({ ...child, key: `${spec.key}-${index}` })
            )}
          </Page>
        );
        
      case 'Text':
        return (
          <Text 
            style={props.style}
            key={spec.key}
          >
            {props.children}
          </Text>
        );
        
      case 'View':
        return (
          <View 
            style={props.style}
            key={spec.key}
          >
            {children && children.map((child: any, index: number) => 
              this.createPdfComponent({ ...child, key: `${spec.key}-${index}` })
            )}
          </View>
        );
        
      default:
        throw new Error('Unsupported component type: ' + type);
    }
  }
  
  static async renderToFile(spec: any, filePath: string): Promise<void> {
    const buffer = await this.render(spec);
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, buffer);
  }
}