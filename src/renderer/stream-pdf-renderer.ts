import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { DocumentSchema } from '../schemas/document';
import { Readable } from 'stream';

// PDF renderer that uses streams
export class StreamPdfRenderer {
  static async render(spec: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Validate
        const validated = DocumentSchema.parse(spec);
        
        // Create React element
        const reactElement = StreamPdfRenderer.createReactElement(validated);
        
        // Generate PDF
        const pdfDoc = pdf(reactElement);
        
        // Use stream to get buffer
        const chunks: Buffer[] = [];
        const stream = pdfDoc.pipe ? pdfDoc : pdfDoc.createReadStream();
        
        if (stream.pipe) {
          // It's a stream
          stream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          
          stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });
          
          stream.on('error', reject);
        } else {
          // Try toBuffer()
          pdfDoc.toBuffer().then((result: any) => {
            if (Buffer.isBuffer(result)) {
              resolve(result);
            } else if (result && typeof result === 'object') {
              // Might be PDFDocument with buffer property
              const buffer = result.buffer || result._pdf || result;
              if (Buffer.isBuffer(buffer)) {
                resolve(buffer);
              } else {
                reject(new Error('toBuffer() did not return a Buffer'));
              }
            } else {
              reject(new Error('Unknown result from toBuffer()'));
            }
          }).catch(reject);
        }
        
      } catch (error: any) {
        reject(new Error('PDF rendering failed: ' + error.message));
      }
    });
  }
  
  static createReactElement(spec: any): React.ReactElement {
    const { type, props, children } = spec;
    
    const childrenWithKeys = children?.map((child: any, index: number) => ({
      ...child,
      key: `${type}-${index}`
    })) || [];
    
    switch (type) {
      case 'Document':
        return React.createElement(
          Document,
          {
            key: 'document',
            title: props?.title || 'PDF',
            author: props?.author || 'PDF AI Generator'
          },
          childrenWithKeys.map(StreamPdfRenderer.createReactElement)
        );
        
      case 'Page':
        return React.createElement(
          Page,
          {
            key: `page-${props?.key || '0'}`,
            size: props?.size || 'A4',
            orientation: props?.orientation || 'portrait'
          },
          childrenWithKeys.map(StreamPdfRenderer.createReactElement)
        );
        
      case 'Text':
        return React.createElement(
          Text,
          {
            key: `text-${props?.key || Date.now()}`,
            style: props?.style || {}
          },
          props?.children || ''
        );
        
      case 'View':
        return React.createElement(
          View,
          {
            key: `view-${props?.key || Date.now()}`,
            style: props?.style || {}
          },
          childrenWithKeys.map(StreamPdfRenderer.createReactElement)
        );
        
      default:
        return React.createElement(
          Text,
          { key: 'unknown' },
          `Unknown: ${type}`
        );
    }
  }
}
