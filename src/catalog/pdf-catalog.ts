import { createCatalog } from '@json-render/core';
import { DocumentSchema } from '../schemas/document';
import { PageSchema } from '../schemas/page';
import { TextSchema } from '../schemas/text';

// Create JSON-Render catalog for PDF components
export const pdfCatalog = createCatalog({
  schemas: {
    Document: DocumentSchema,
    Page: PageSchema,
    Text: TextSchema,
  },
  
  // Component implementations that map to React-PDF
  components: {
    Document: ({ children, title, author, subject }: any) => {
      // Document metadata for React-PDF
      return {
        type: 'document',
        props: { title, author, subject },
        children
      };
    },
    
    Page: ({ children, size = 'A4', orientation = 'portrait', style }: any) => {
      return {
        type: 'page',
        props: { size, orientation, style },
        children
      };
    },
    
    Text: ({ children, style }: any) => {
      return {
        type: 'text',
        props: { children, style },
        children: []
      };
    },
    
    View: ({ children, style }: any) => {
      return {
        type: 'view',
        props: { style },
        children
      };
    }
  }
});

// Helper to render JSON spec through JSON-Render catalog
export function renderWithJsonRender(spec: any): any {
  try {
    // Use JSON-Render to process the spec
    const result = pdfCatalog.render(spec);
    return result;
  } catch (error: any) {
    console.error('JSON-Render error:', error);
    throw new Error('JSON-Render processing failed: ' + error.message);
  }
}

// Convert JSON-Render output to React-PDF components
export function jsonRenderToReactPdf(jsonRenderOutput: any): any {
  const { type, props, children } = jsonRenderOutput;
  
  // Map JSON-Render types to React-PDF components
  switch (type) {
    case 'document':
      return {
        type: 'Document',
        props: {
          title: props.title,
          author: props.author,
          subject: props.subject
        },
        children: children?.map(jsonRenderToReactPdf) || []
      };
      
    case 'page':
      return {
        type: 'Page',
        props: {
          size: props.size || 'A4',
          orientation: props.orientation || 'portrait',
          style: props.style
        },
        children: children?.map(jsonRenderToReactPdf) || []
      };
      
    case 'text':
      return {
        type: 'Text',
        props: {
          children: props.children,
          style: props.style
        }
      };
      
    case 'view':
      return {
        type: 'View',
        props: {
          style: props.style
        },
        children: children?.map(jsonRenderToReactPdf) || []
      };
      
    default:
      throw new Error(`Unknown JSON-Render type: ${type}`);
  }
}

// Complete pipeline: JSON Spec → JSON-Render → React-PDF
export function processPdfSpec(spec: any): any {
  // Step 1: Process through JSON-Render catalog
  const jsonRenderResult = renderWithJsonRender(spec);
  
  // Step 2: Convert to React-PDF format
  const reactPdfSpec = jsonRenderToReactPdf(jsonRenderResult);
  
  return reactPdfSpec;
}