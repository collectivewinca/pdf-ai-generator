import React from 'react';
import { Document, Page, Text, View, pdf, StyleSheet } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';
import { processPdfSpec } from '../catalog/pdf-catalog';

// Create default styles
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
  section: {
    marginBottom: 20,
  },
});

// Component mapper for React-PDF
const componentMap: Record<string, React.FC<any>> = {
  Document: ({ children, title, author, subject }: any) => (
    <Document title={title} author={author} subject={subject}>
      {children}
    </Document>
  ),
  
  Page: ({ children, size = 'A4', orientation = 'portrait', style }: any) => {
    const pageStyle = { ...styles.page, ...style };
    return (
      <Page size={size} orientation={orientation} style={pageStyle}>
        {children}
      </Page>
    );
  },
  
  Text: ({ children, style }: any) => {
    const textStyle = { ...styles.text, ...style };
    return <Text style={textStyle}>{children}</Text>;
  },
  
  View: ({ children, style }: any) => {
    const viewStyle = { ...styles.section, ...style };
    return <View style={viewStyle}>{children}</View>;
  },
};

// Recursive render function
function renderComponent(component: any, key: string): React.ReactElement {
  const { type, props, children } = component;
  
  const Component = componentMap[type];
  if (!Component) {
    throw new Error(`Unknown component type: ${type}`);
  }
  
  return (
    <Component key={key} {...props}>
      {children?.map((child: any, index: number) => 
        renderComponent(child, `${key}-${index}`)
      )}
    </Component>
  );
}

// Complete PDF Renderer with JSON-Render integration
export class CompletePDFRenderer {
  static async render(spec: any): Promise<Buffer> {
    try {
      console.log('Starting PDF rendering pipeline...');
      
      // Step 1: Validate with Zod
      console.log('Step 1: Validating spec with Zod...');
      const validatedSpec = DocumentSchema.parse(spec);
      
      // Step 2: Process through JSON-Render catalog
      console.log('Step 2: Processing through JSON-Render catalog...');
      const processedSpec = processPdfSpec(validatedSpec);
      
      // Step 3: Create React component
      console.log('Step 3: Creating React-PDF component...');
      const PdfDocument = () => renderComponent(processedSpec, 'doc');
      
      // Step 4: Generate PDF
      console.log('Step 4: Generating PDF...');
      const instance = pdf(<PdfDocument />);
      const buffer = await instance.toBuffer();
      
      console.log('PDF rendering completed successfully!');
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
  
  // Test method
  static async createTestPdf(filePath: string): Promise<void> {
    const testSpec = {
      type: 'Document',
      props: {
        title: 'JSON-Render + React-PDF Test',
        author: 'PDF AI Generator',
        subject: 'Integration Test'
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
                children: 'JSON-Render + React-PDF Integration',
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
                children: 'Complete PDF Generation Pipeline:',
                style: {
                  fontSize: 18,
                  textAlign: 'center',
                  marginTop: 30
                }
              }
            },
            {
              type: 'View',
              props: {
                style: {
                  marginTop: 50,
                  padding: 20
                }
              },
              children: [
                {
                  type: 'Text',
                  props: {
                    children: '1. AI (Deepseek) → JSON Spec',
                    style: { fontSize: 14, marginBottom: 10 }
                  }
                },
                {
                  type: 'Text',
                  props: {
                    children: '2. JSON Spec → JSON-Render Catalog',
                    style: { fontSize: 14, marginBottom: 10 }
                  }
                },
                {
                  type: 'Text',
                  props: {
                    children: '3. JSON-Render → React-PDF Components',
                    style: { fontSize: 14, marginBottom: 10 }
                  }
                },
                {
                  type: 'Text',
                  props: {
                    children: '4. React-PDF → PDF File',
                    style: { fontSize: 14 }
                  }
                }
              ]
            }
          ]
        }
      ]
    };
    
    await this.renderToFile(testSpec, filePath);
  }
}