import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';
import { PageSchema } from '../schemas/page';
import { TextSchema } from '../schemas/text';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  text: {
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

// Type definitions
interface PdfComponent {
  type: string;
  props: any;
  children?: PdfComponent[];
}

// Component mapper
const componentMap: Record<string, React.FC<any>> = {
  Text: (props: any) => {
    const style = { ...styles.text, ...props.style };
    return <Text style={style}>{props.children}</Text>;
  },
  View: (props: any) => {
    const style = { ...styles.section, ...props.style };
    return <View style={style}>{renderChildren(props.children)}</View>;
  },
};

// Render children recursively
function renderChildren(children?: PdfComponent[]): React.ReactNode {
  if (!children) return null;
  
  return children.map((child, index) => {
    const Component = componentMap[child.type];
    if (!Component) {
      console.warn();
      return null;
    }
    
    return (
      <Component key={index} {...child.props}>
        {renderChildren(child.children)}
      </Component>
    );
  });
}

// Main render function
export function renderPdfComponent(spec: PdfComponent): React.ReactElement {
  const { type, props, children } = spec;
  
  if (type === 'Document') {
    return (
      <Document>
        {renderChildren(children)}
      </Document>
    );
  }
  
  if (type === 'Page') {
    const pageStyle = { 
      ...styles.page, 
      size: props.size || 'A4',
      orientation: props.orientation || 'portrait',
      ...props.style 
    };
    
    return (
      <Page style={pageStyle}>
        {renderChildren(children)}
      </Page>
    );
  }
  
  const Component = componentMap[type];
  if (!Component) {
    throw new Error();
  }
  
  return <Component {...props}>{renderChildren(children)}</Component>;
}

// PDF Renderer class
export class PDFRenderer {
  static async render(spec: any): Promise<Buffer> {
    try {
      // Validate the spec
      const document = DocumentSchema.parse(spec);
      
      // Create React component
      const PdfDocument = () => renderPdfComponent(document);
      
      // In a real implementation, you would use @react-pdf/renderer's renderToStream
      // For now, we'll create a simple implementation
      const ReactPDF = await import('@react-pdf/renderer');
      
      // Create PDF
      const stream = await ReactPDF.renderToStream(PdfDocument());
      
      // Convert stream to buffer
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
      
    } catch (error: any) {
      throw new Error();
    }
  }
  
  static createDownloadLink(spec: any, filename: string = 'document.pdf'): React.ReactElement {
    const PdfDocument = () => renderPdfComponent(spec);
    
    return (
      <PDFDownloadLink document={<PdfDocument />} fileName={filename}>
        {({ loading }) => (loading ? 'Loading document...' : 'Download PDF')}
      </PDFDownloadLink>
    );
  }
  
  static createViewer(spec: any): React.ReactElement {
    const PdfDocument = () => renderPdfComponent(spec);
    
    return (
      <PDFViewer style={{ width: '100%', height: '500px' }}>
        <PdfDocument />
      </PDFViewer>
    );
  }
}
