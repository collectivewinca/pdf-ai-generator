import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';
import { Readable } from 'stream';

// Proper PDF renderer that handles React-PDF streams correctly
export class ProperPdfRenderer {
  static async render(spec: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Validate
        const validated = DocumentSchema.parse(spec);
        
        // Create React element
        const reactElement = ProperPdfRenderer.createReactElement(validated);
        
        // Generate PDF - pdf() returns a PDFDocument instance
        const pdfDoc = pdf(reactElement);
        
        // toBuffer() actually returns a stream (despite the name)
        const stream = pdfDoc.toBuffer();
        
        // Collect stream data
        const chunks: Buffer[] = [];
        
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        stream.on('error', (error: Error) => {
          reject(new Error('PDF stream error: ' + error.message));
        });
        
      } catch (error: any) {
        reject(new Error('PDF rendering failed: ' + error.message));
      }
    });
  }
  
  static createReactElement(spec: any): React.ReactElement {
    const { type, props, children } = spec;
    
    // Generate unique keys
    const childrenWithKeys = children?.map((child: any, index: number) => ({
      ...child,
      _key: `${child.type || 'child'}-${index}`
    })) || [];
    
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
          childrenWithKeys.map((child: any) => 
            ProperPdfRenderer.createReactElement(child)
          )
        );
        
      case 'Page':
        return React.createElement(
          Page,
          {
            key: `page-${props?.key || '0'}`,
            size: props?.size || 'A4',
            orientation: props?.orientation || 'portrait',
            style: props?.style
          },
          childrenWithKeys.map((child: any) => 
            ProperPdfRenderer.createReactElement(child)
          )
        );
        
      case 'Text':
        return React.createElement(
          Text,
          {
            key: `text-${Date.now()}-${Math.random()}`,
            style: props?.style || {}
          },
          props?.children || ''
        );
        
      case 'View':
        return React.createElement(
          View,
          {
            key: `view-${Date.now()}-${Math.random()}`,
            style: props?.style || {}
          },
          childrenWithKeys.map((child: any) => 
            ProperPdfRenderer.createReactElement(child)
          )
        );
        
      default:
        return React.createElement(
          Text,
          { key: 'unknown' },
          `Component: ${type}`
        );
    }
  }
  
  // Simple test renderer for debugging
  static async renderSimple(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const MyDocument = () => React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          { size: 'A4' },
          React.createElement(
            Text,
            null,
            'Test PDF from ProperPdfRenderer'
          )
        )
      );
      
      const pdfDoc = pdf(React.createElement(MyDocument));
      const stream = pdfDoc.toBuffer();
      
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
