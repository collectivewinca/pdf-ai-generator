import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';

// Fixed bridge that properly handles PDF generation
export class FixedJsonRenderBridge {
  // Convert JSON spec to React element
  static jsonToReactElement(spec: any): React.ReactElement {
    const { type, props, children } = spec;
    
    // Map spec types to React-PDF components
    switch (type) {
      case 'Document':
        return React.createElement(
          Document,
          {
            title: props?.title,
            author: props?.author,
            subject: props?.subject
          },
          children?.map(FixedJsonRenderBridge.jsonToReactElement) || []
        );
        
      case 'Page':
        return React.createElement(
          Page,
          {
            size: props?.size || 'A4',
            orientation: props?.orientation || 'portrait',
            style: props?.style
          },
          children?.map(FixedJsonRenderBridge.jsonToReactElement) || []
        );
        
      case 'Text':
        return React.createElement(
          Text,
          {
            style: props?.style || {}
          },
          props?.children || ''
        );
        
      case 'View':
        return React.createElement(
          View,
          {
            style: props?.style || {}
          },
          children?.map(FixedJsonRenderBridge.jsonToReactElement) || []
        );
        
      default:
        return React.createElement(
          Text,
          { style: { color: 'red' } },
          `Unknown component type: ${type}`
        );
    }
  }
  
  // Render PDF from JSON spec
  static async render(spec: any): Promise<Buffer> {
    try {
      // Validate
      const validated = DocumentSchema.parse(spec);
      
      // Convert to React element
      const reactElement = FixedJsonRenderBridge.jsonToReactElement(validated);
      
      // Generate PDF - pdf() returns a PDFDocument instance
      const pdfDoc = pdf(reactElement);
      
      // Convert to Buffer
      const buffer = await pdfDoc.toBuffer();
      
      return buffer;
      
    } catch (error: any) {
      console.error('PDF rendering error:', error);
      throw new Error('PDF rendering failed: ' + error.message);
    }
  }
}
