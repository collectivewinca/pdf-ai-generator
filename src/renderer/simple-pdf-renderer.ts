import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';

// Simple but reliable PDF renderer
export class SimplePdfRenderer {
  static async render(spec: any): Promise<Buffer> {
    try {
      // Validate
      const validated = DocumentSchema.parse(spec);
      
      // Create React element from spec
      const reactElement = SimplePdfRenderer.createReactElement(validated);
      
      // Generate PDF
      const pdfDoc = pdf(reactElement);
      const buffer = await pdfDoc.toBuffer();
      
      return buffer;
      
    } catch (error: any) {
      console.error('PDF rendering error:', error);
      throw new Error('PDF rendering failed: ' + error.message);
    }
  }
  
  static createReactElement(spec: any): React.ReactElement {
    const { type, props, children } = spec;
    
    // Add keys to children to fix React warnings
    const childrenWithKeys = children?.map((child: any, index: number) => {
      if (child) {
        return {
          ...child,
          key: index
        };
      }
      return child;
    }) || [];
    
    switch (type) {
      case 'Document':
        return React.createElement(
          Document,
          {
            key: 'document',
            title: props?.title || 'PDF Document',
            author: props?.author || 'PDF AI Generator',
            subject: props?.subject || 'Generated PDF'
          },
          childrenWithKeys.map(SimplePdfRenderer.createReactElement)
        );
        
      case 'Page':
        return React.createElement(
          Page,
          {
            key: props?.key || 'page',
            size: props?.size || 'A4',
            orientation: props?.orientation || 'portrait',
            style: props?.style
          },
          childrenWithKeys.map(SimplePdfRenderer.createReactElement)
        );
        
      case 'Text':
        return React.createElement(
          Text,
          {
            key: props?.key || 'text',
            style: props?.style || {}
          },
          props?.children || ''
        );
        
      case 'View':
        return React.createElement(
          View,
          {
            key: props?.key || 'view',
            style: props?.style || {}
          },
          childrenWithKeys.map(SimplePdfRenderer.createReactElement)
        );
        
      default:
        // Fallback
        return React.createElement(
          Text,
          { key: 'unknown', style: { color: 'red' } },
          `Unknown: ${type}`
        );
    }
  }
}
