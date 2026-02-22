import { createCatalog } from '@json-render/core';
import { DocumentSchema } from '../schemas/document';

// JSON-Render Catalog for PDF Components
// This defines how JSON specs map to React-PDF components

export const pdfComponents = {
  // Document - root of the PDF
  Document: {
    schema: DocumentSchema,
    render: (props: any, children: any) => ({
      type: 'Document',
      props: {
        title: props?.title || 'PDF Document',
        author: props?.author || 'PDF AI Generator',
        subject: props?.subject || ''
      },
      children: children || []
    })
  },

  // Page - individual pages
  Page: {
    render: (props: any, children: any) => ({
      type: 'Page',
      props: {
        size: props?.size || 'A4',
        orientation: props?.orientation || 'portrait',
        style: props?.style || {}
      },
      children: children || []
    })
  },

  // Text - text content
  Text: {
    render: (props: any) => ({
      type: 'Text',
      props: {
        children: props?.children || '',
        style: props?.style || {}
      },
      children: []
    })
  },

  // View - container for grouping
  View: {
    render: (props: any, children: any) => ({
      type: 'View',
      props: {
        style: props?.style || {}
      },
      children: children || []
    })
  },

  // Image - for logos/images
  Image: {
    render: (props: any) => ({
      type: 'Image',
      props: {
        src: props?.src || '',
        style: props?.style || {}
      },
      children: []
    })
  },

  // Table - for tabular data
  Table: {
    render: (props: any, children: any) => ({
      type: 'Table',
      props: {
        style: props?.style || {}
      },
      children: children || []
    })
  },

  // TableRow - table row
  TableRow: {
    render: (props: any, children: any) => ({
      type: 'TableRow',
      props: props || {},
      children: children || []
    })
  },

  // TableCell - table cell
  TableCell: {
    render: (props: any) => ({
      type: 'TableCell',
      props: {
        children: props?.children || '',
        style: props?.style || {}
      },
      children: []
    })
  }
};

// Create the JSON-Render catalog
export const pdfCatalog = createCatalog({
  components: pdfComponents,
  schemas: {
    Document: DocumentSchema
  }
});

// Helper: Process a JSON spec through JSON-Render catalog
export function processWithJsonRender(spec: any): any {
  try {
    return pdfCatalog.render(spec);
  } catch (error: any) {
    console.error('JSON-Render error:', error.message);
    throw error;
  }
}

// Generate a catalog prompt for AI
export function generateCatalogPrompt(): string {
  return pdfCatalog.generateCatalogPrompt();
}

// Validate against catalog
export function validateWithCatalog(spec: any): { valid: boolean; errors?: any[] } {
  try {
    pdfCatalog.validate(spec);
    return { valid: true };
  } catch (error: any) {
    return { valid: false, errors: [error.message] };
  }
}
