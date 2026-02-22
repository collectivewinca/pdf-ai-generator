import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';
import { Writable } from 'stream';

// Final PDF renderer that correctly handles React-PDF streams
export class FinalPdfRenderer {
  static async render(spec: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Validate
        const validated = DocumentSchema.parse(spec);
        
        // Create React element
        const reactElement = FinalPdfRenderer.createReactElement(validated);
        
        // Generate PDF
        const pdfDoc = pdf(reactElement);
        
        // toBuffer() returns a PDFDocument stream
        pdfDoc.toBuffer().then((pdfStream: any) => {
          // Collect stream data
          const chunks: Buffer[] = [];
          
          const writable = new Writable({
            write(chunk: Buffer, encoding: string, callback: () => void) {
              chunks.push(chunk);
              callback();
            }
          });
          
          // Pipe PDF stream to our writable
          pdfStream.pipe(writable);
          
          writable.on('finish', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });
          
          writable.on('error', (error: Error) => {
            reject(new Error('PDF stream error: ' + error.message));
          });
          
        }).catch((error: Error) => {
          reject(new Error('PDF generation failed: ' + error.message));
        });
        
      } catch (error: any) {
        reject(new Error('PDF rendering failed: ' + error.message));
      }
    });
  }
  
  static createReactElement(spec: any): React.ReactElement {
    const { type, props, children } = spec;
    
    // Generate unique keys using index
    const childrenElements = children?.map((child: any, index: number) => 
      FinalPdfRenderer.createReactElement({
        ...child,
        _index: index
      })
    ) || [];
    
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
          childrenElements
        );
        
      case 'Page':
        return React.createElement(
          Page,
          {
            key: `page-${props?._index || 0}`,
            size: props?.size || 'A4',
            orientation: props?.orientation || 'portrait',
            style: props?.style
          },
          childrenElements
        );
        
      case 'Text':
        return React.createElement(
          Text,
          {
            key: `text-${props?._index || Date.now()}`,
            style: props?.style || {}
          },
          props?.children || ''
        );
        
      case 'View':
        return React.createElement(
          View,
          {
            key: `view-${props?._index || Date.now()}`,
            style: props?.style || {}
          },
          childrenElements
        );
        
      default:
        return React.createElement(
          Text,
          { key: 'unknown' },
          `${type || 'Component'}`
        );
    }
  }
}
