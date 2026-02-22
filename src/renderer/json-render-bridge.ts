import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { pdfCatalog, processPdfSpec } from '../catalog/pdf-catalog';
import { DocumentSchema } from '../schemas/document';

// Bridge between JSON-Render output and React-PDF
export class JsonRenderBridge {
  // Convert JSON-Render output to React element
  static jsonRenderToReactElement(jsonRenderOutput: any): React.ReactElement {
    const { type, props, children } = jsonRenderOutput;
    
    // Map JSON-Render types to React-PDF components
    switch (type) {
      case 'document':
        return React.createElement(
          Document,
          {
            title: props.title,
            author: props.author,
            subject: props.subject
          },
          children?.map(JsonRenderBridge.jsonRenderToReactElement) || []
        );
        
      case 'page':
        return React.createElement(
          Page,
          {
            size: props.size || 'A4',
            orientation: props.orientation || 'portrait',
            style: props.style
          },
          children?.map(JsonRenderBridge.jsonRenderToReactElement) || []
        );
        
      case 'text':
        return React.createElement(
          Text,
          {
            style: props.style
          },
          props.children || ''
        );
        
      case 'view':
        return React.createElement(
          View,
          {
            style: props.style
          },
          children?.map(JsonRenderBridge.jsonRenderToReactElement) || []
        );
        
      default:
        // Fallback to Text for unknown types
        return React.createElement(
          Text,
          { style: { color: 'red' } },
          `Unknown component type: ${type}`
        );
    }
  }
  
  // Process JSON spec through JSON-Render and convert to React-PDF
  static async render(spec: any): Promise<Buffer> {
    try {
      // Step 1: Validate
      const validated = DocumentSchema.parse(spec);
      
      // Step 2: Process through JSON-Render catalog
      console.log('Processing through JSON-Render catalog...');
      const jsonRenderResult = processPdfSpec(validated);
      
      // Step 3: Convert to React element
      console.log('Converting to React element...');
      const reactElement = JsonRenderBridge.jsonRenderToReactElement(jsonRenderResult);
      
      // Step 4: Generate PDF
      console.log('Generating PDF...');
      const instance = pdf(reactElement);
      const buffer = await instance.toBuffer();
      
      console.log('PDF generated successfully!');
      return buffer;
      
    } catch (error: any) {
      console.error('JSON-Render bridge error:', error);
      throw new Error('JSON-Render bridge failed: ' + error.message);
    }
  }
  
  // Alternative: Direct render without JSON-Render (for debugging)
  static async renderDirect(spec: any): Promise<Buffer> {
    try {
      const validated = DocumentSchema.parse(spec);
      
      // Create a simple document from the spec
      const MyDocument = () => React.createElement(
        Document,
        { title: validated.props.title },
        validated.children?.map((page: any, index: number) => 
          React.createElement(
            Page,
            { 
              key: index,
              size: page.props.size || 'A4',
              orientation: page.props.orientation || 'portrait'
            },
            page.children?.map((component: any, compIndex: number) => {
              if (component.type === 'Text') {
                return React.createElement(
                  Text,
                  { 
                    key: compIndex,
                    style: component.props.style || {}
                  },
                  component.props.children || `Text ${compIndex}`
                );
              } else if (component.type === 'View') {
                return React.createElement(
                  View,
                  { 
                    key: compIndex,
                    style: component.props.style || {}
                  },
                  component.children?.map((child: any, childIndex: number) =>
                    React.createElement(
                      Text,
                      { key: childIndex },
                      child.props.children || 'Child text'
                    )
                  ) || []
                );
              }
              return null;
            }) || []
          )
        ) || []
      );
      
      const instance = pdf(React.createElement(MyDocument));
      return await instance.toBuffer();
      
    } catch (error: any) {
      console.error('Direct render error:', error);
      throw new Error('Direct render failed: ' + error.message);
    }
  }
}
