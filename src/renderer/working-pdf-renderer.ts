import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
});

// Component mapper
const componentMap: Record<string, React.FC<any>> = {
  Text: (props: any) => {
    const mergedStyle = { ...styles.text, ...props.style };
    return <Text style={mergedStyle}>{props.children}</Text>;
  },
  View: (props: any) => {
    const mergedStyle = { ...styles.section, ...props.style };
    return <View style={mergedStyle}>{props.children}</View>;
  },
};

// Recursive render function
function renderComponent(component: any, key: string): React.ReactElement {
  const { type, props, children } = component;
  
  if (type === 'Document') {
    return (
      <Document key={key}>
        {children?.map((child: any, index: number) => 
          renderComponent(child, `${key}-${index}`)
        )}
      </Document>
    );
  }
  
  if (type === 'Page') {
    return (
      <Page 
        key={key}
        size={props.size || 'A4'}
        orientation={props.orientation || 'portrait'}
        style={props.style}
      >
        {children?.map((child: any, index: number) => 
          renderComponent(child, `${key}-${index}`)
        )}
      </Page>
    );
  }
  
  const Component = componentMap[type];
  if (!Component) {
    // Fallback to Text for unknown components
    return <Text key={key} style={styles.text}>[Unknown: {type}]</Text>;
  }
  
  return (
    <Component key={key} {...props}>
      {children?.map((child: any, index: number) => 
        renderComponent(child, `${key}-${index}`)
      )}
    </Component>
  );
}

// Main PDF Renderer class
export class WorkingPDFRenderer {
  static async render(spec: any): Promise<Buffer> {
    try {
      // Validate the spec
      const validatedSpec = DocumentSchema.parse(spec);
      
      // Create React component
      const PdfDocument = () => renderComponent(validatedSpec, 'doc');
      
      // Generate PDF
      const instance = pdf(<PdfDocument />);
      const buffer = await instance.toBuffer();
      
      return buffer;
      
    } catch (error: any) {
      console.error('PDF rendering error:', error);
      throw new Error(`PDF rendering failed: ${error.message}`);
    }
  }
  
  static async renderToFile(spec: any, filePath: string): Promise<void> {
    const buffer = await this.render(spec);
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, buffer);
  }
  
  // Helper to create a simple test PDF
  static async createTestPdf(filePath: string): Promise<void> {
    const testSpec = {
      type: 'Document',
      props: {
        title: 'Test PDF',
        author: 'PDF AI Generator',
        subject: 'Test Document'
      },
      children: [
        {
          type: 'Page',
          props: {
            size: 'A4',
            orientation: 'portrait'
          },
          children: [
            {
              type: 'Text',
              props: {
                children: 'PDF AI Generator Test',
                style: {
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: 100
                }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'This PDF was generated successfully!',
                style: {
                  fontSize: 16,
                  textAlign: 'center',
                  marginTop: 30
                }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Date: ' + new Date().toLocaleDateString(),
                style: {
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 50
                }
              }
            }
          ]
        }
      ]
    };
    
    await this.renderToFile(testSpec, filePath);
  }
}