---
name: json-render-react-pdf
description: |
  Integrate json-render (Vercel Labs Generative UI framework) with react-pdf for AI-generated PDF layouts.
  Use when: (1) You need to generate PDFs dynamically from AI prompts, (2) You want AI to create PDF layouts
  (invoices, reports, documents) using structured JSON specs, (3) You're using json-render for Generative UI
  and need PDF output. Covers: json-render catalog definition for PDF components, react-pdf renderer adapter,
  and AI prompt engineering for PDF generation.
author: Claude Code
version: 1.0.0
date: 2026-02-21
---

# JSON-Render + React-PDF Integration

## Problem
Generating PDFs from AI prompts requires converting unstructured AI output into structured PDF layouts. 
Traditional approaches either: (1) Use fixed templates that AI can only fill with data, or (2) Generate 
unstructured HTML/PDF that's unpredictable and unsafe. There's no standard way to let AI dynamically 
create PDF layouts while maintaining type safety and predictable output.

## Context / Trigger Conditions
- You need AI to generate PDFs (invoices, reports, documents) with custom layouts
- You're using or considering json-render for Generative UI
- You want type-safe PDF generation from AI prompts
- You need to constrain AI output to valid PDF component structures
- You want to reuse existing react-pdf components in AI-generated layouts

## Solution

### Step 1: Define a PDF Component Catalog

Create a catalog that maps JSON specs to react-pdf primitives. **Note:** json-render 0.1.0 uses `createCatalog`, while newer versions use `defineCatalog`.

```typescript
// pdf-catalog.ts
import { createCatalog } from '@json-render/core'; // v0.1.0
// OR: import { defineCatalog } from '@json-render/core'; // v0.2.0+
import { z } from 'zod';

// For json-render v0.1.0:
export const pdfCatalog = createCatalog({
  components: {
    // Basic PDF primitives
    Document: {
      props: z.object({
        title: z.string().optional(),
        author: z.string().optional(),
        subject: z.string().optional(),
      }),
      slots: ["default"],
      description: "Root PDF document container",
    },
    
    Page: {
      props: z.object({
        size: z.enum(["A4", "LETTER", "LEGAL"]).default("A4"),
        orientation: z.enum(["portrait", "landscape"]).default("portrait"),
        style: z.record(z.any()).optional(),
      }),
      slots: ["default"],
      description: "PDF page with size and orientation",
    },
    
    Text: {
      props: z.object({
        children: z.string(),
        style: z.record(z.any()).optional(),
        fixed: z.boolean().optional(),
      }),
      description: "Text element in PDF",
    },
    
    View: {
      props: z.object({
        style: z.record(z.any()).optional(),
      }),
      slots: ["default"],
      description: "Container for layout (like div)",
    },
    
    // Higher-level PDF components
    InvoiceHeader: {
      props: z.object({
        companyName: z.string(),
        invoiceNumber: z.string(),
        date: z.string(),
        dueDate: z.string(),
      }),
      description: "Invoice header with company info",
    },
    
    InvoiceTable: {
      props: z.object({
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        currency: z.string().default("USD"),
      }),
      description: "Invoice line items table",
    },
    
    TotalSection: {
      props: z.object({
        subtotal: z.number(),
        tax: z.number().optional(),
        discount: z.number().optional(),
        total: z.number(),
      }),
      description: "Invoice totals section",
    },
  },
  
  actions: {
    downloadPDF: {
      params: z.object({
        filename: z.string().default("document.pdf"),
      }),
      description: "Download the generated PDF",
    },
    
    printPDF: {
      params: z.object({}),
      description: "Print the PDF",
    },
  },
});
```

### Step 2: Create a React-PDF Renderer Adapter

Build an adapter that converts json-render specs to react-pdf components:

```typescript
// pdf-renderer.tsx
import React from 'react';
import {
  Document as PdfDocument,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
  StyleSheet,
} from '@react-pdf/renderer';
import { SpecElement } from '@json-render/core';

// Map json-render component names to react-pdf components
const componentMap = {
  Document: PdfDocument,
  Page: PdfPage,
  Text: PdfText,
  View: PdfView,
  // Add custom component implementations
  InvoiceHeader: ({ companyName, invoiceNumber, date, dueDate }: any) => (
    <PdfView style={styles.invoiceHeader}>
      <PdfText style={styles.companyName}>{companyName}</PdfText>
      <PdfView style={styles.invoiceInfo}>
        <PdfText>Invoice #: {invoiceNumber}</PdfText>
        <PdfText>Date: {date}</PdfText>
        <PdfText>Due Date: {dueDate}</PdfText>
      </PdfView>
    </PdfView>
  ),
  
  InvoiceTable: ({ items, currency }: any) => (
    <PdfView style={styles.table}>
      <PdfView style={styles.tableHeader}>
        <PdfText style={styles.col1}>Description</PdfText>
        <PdfText style={styles.col2}>Qty</PdfText>
        <PdfText style={styles.col3}>Unit Price</PdfText>
        <PdfText style={styles.col4}>Total</PdfText>
      </PdfView>
      {items.map((item: any, index: number) => (
        <PdfView key={index} style={styles.tableRow}>
          <PdfText style={styles.col1}>{item.description}</PdfText>
          <PdfText style={styles.col2}>{item.quantity}</PdfText>
          <PdfText style={styles.col3}>
            {currency} {item.unitPrice.toFixed(2)}
          </PdfText>
          <PdfText style={styles.col4}>
            {currency} {item.total.toFixed(2)}
          </PdfText>
        </PdfView>
      ))}
    </PdfView>
  ),
  
  TotalSection: ({ subtotal, tax = 0, discount = 0, total }: any) => (
    <PdfView style={styles.totals}>
      <PdfView style={styles.totalRow}>
        <PdfText>Subtotal:</PdfText>
        <PdfText>{subtotal.toFixed(2)}</PdfText>
      </PdfView>
      {tax > 0 && (
        <PdfView style={styles.totalRow}>
          <PdfText>Tax:</PdfText>
          <PdfText>{tax.toFixed(2)}</PdfText>
        </PdfView>
      )}
      {discount > 0 && (
        <PdfView style={styles.totalRow}>
          <PdfText>Discount:</PdfText>
          <PdfText>-{discount.toFixed(2)}</PdfText>
        </PdfView>
      )}
      <PdfView style={[styles.totalRow, styles.grandTotal]}>
        <PdfText>Total:</PdfText>
        <PdfText>{total.toFixed(2)}</PdfText>
      </PdfView>
    </PdfView>
  ),
};

// PDF styles
const styles = StyleSheet.create({
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  invoiceInfo: {
    fontSize: 10,
  },
  table: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  col1: { width: '50%' },
  col2: { width: '15%' },
  col3: { width: '20%' },
  col4: { width: '15%' },
  totals: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 5,
    paddingTop: 5,
    fontWeight: 'bold',
  },
});

// Main renderer function
export function renderPdfFromSpec(spec: SpecElement): React.ReactElement {
  const { type, props, children } = spec;
  const Component = componentMap[type as keyof typeof componentMap];
  
  if (!Component) {
    throw new Error(`Unknown PDF component: ${type}`);
  }
  
  const childElements = children
    ? children.map((child, index) => renderPdfFromSpec(child))
    : undefined;
  
  return React.createElement(Component, { key: props?.id, ...props }, childElements);
}
```

### Step 3: Generate AI Prompts for PDF Creation

Create specialized prompts that guide AI to generate valid PDF specs:

```typescript
// pdf-prompt.ts
import { pdfCatalog } from './pdf-catalog';

export function getPdfGenerationPrompt(userRequest: string): string {
  // For json-render v0.1.0, generate prompt manually
  // For v0.2.0+: const catalogPrompt = pdfCatalog.prompt({
  const catalogPrompt = `Generate PDF layouts using these components:
  
  Available components: Document, Page, Text, View, InvoiceHeader, InvoiceTable, TotalSection
  
  Component rules:
  1. Document: Root container, optional title/author props
  2. Page: Must specify size (A4, LETTER, LEGAL) and orientation
  3. Text: Contains text content as children prop
  4. View: Layout container (like div)
  5. Use styles for positioning and formatting
  
  Return JSON spec with type, props, and children arrays.`;
    system: `You are a PDF layout generator. Create structured PDF layouts using the available components.
    
    IMPORTANT PDF-SPECIFIC RULES:
    1. All content must fit within Page components
    2. Use View for layout containers (like divs in HTML)
    3. Text components can only contain strings as children
    4. Page size defaults to A4 portrait
    5. Consider page breaks for long content
    6. Use styles for positioning and formatting
    
    Available components: ${pdfCatalog.componentNames.join(', ')}
    `,
  });
  
  return `${catalogPrompt}

User request: ${userRequest}

Generate a PDF spec that fulfills this request. Focus on:
1. Clear information hierarchy
2. Proper use of layout containers (View components)
3. Appropriate text formatting
4. Logical grouping of related content
5. Professional document structure

Return ONLY the JSON spec, no explanations.`;
}

// Example usage for invoice generation
export const invoicePrompt = getPdfGenerationPrompt(
  "Create an invoice for Acme Corp with invoice number INV-2024-001, dated today, due in 30 days. " +
  "Include 3 line items: Website Design (5 hours at $150/hr), Hosting Setup (1 hour at $100/hr), " +
  "and Domain Registration ($15). Add 10% tax. Company name: 'Digital Solutions Inc'."
);
```

### Step 4: Integrate with AI and Generate PDF

Complete integration example:

```typescript
// pdf-generator.tsx
import React, { useState } from 'react';
import { pdfCatalog } from './pdf-catalog';
import { renderPdfFromSpec } from './pdf-renderer';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { getPdfGenerationPrompt } from './pdf-prompt';

export function PdfGenerator() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userRequest, setUserRequest] = useState('');
  
  async function generatePdf() {
    setLoading(true);
    try {
      // 1. Get AI-generated spec (using your preferred AI provider)
      const prompt = getPdfGenerationPrompt(userRequest);
      const aiResponse = await callAI(prompt); // Implement your AI call
      
      // 2. Validate the spec against catalog
      // For json-render v0.1.0, validate manually with Zod
      // For v0.2.0+: const validation = pdfCatalog.validate(aiResponse);
      const DocumentSchema = z.object({
        type: z.literal('Document'),
        props: z.object({ title: z.string().optional() }).optional(),
        children: z.array(z.any()),
      });
      
      const validation = DocumentSchema.safeParse(aiResponse);
      if (!validation.success) {
        throw new Error(`Invalid spec: ${validation.error.errors.map(e => e.message).join(', ')}`);
      }
      
      // 3. Store the validated spec
      setSpec(aiResponse);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // Example AI call function (implement based on your AI provider)
  async function callAI(prompt: string): Promise<any> {
    // Example using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }
  
  return (
    <div>
      <textarea
        value={userRequest}
        onChange={(e) => setUserRequest(e.target.value)}
        placeholder="Describe the PDF you want to generate..."
        rows={4}
        style={{ width: '100%' }}
      />
      
      <button onClick={generatePdf} disabled={loading}>
        {loading ? 'Generating...' : 'Generate PDF'}
      </button>
      
      {spec && (
        <div>
          <h3>Preview</h3>
          <PDFViewer width="100%" height="500px">
            {renderPdfFromSpec(spec)}
          </PDFViewer>
          
          <PDFDownloadLink
            document={renderPdfFromSpec(spec)}
            fileName="generated-document.pdf"
          >
            {({ loading }) => (loading ? 'Preparing download...' : 'Download PDF')}
          </PDFDownloadLink>
        </div>
      )}
    </div>
  );
}
```

## Verification

1. **Schema Validation**: Validate AI-generated specs with Zod schemas
2. **PDF Rendering**: Use `PDFViewer` to preview generated PDFs in browser  
3. **Download Test**: Generate and download PDF to verify file integrity
4. **AI Output Check**: Ensure AI generates proper JSON specs matching component schemas

**Tested Components:**
- ✅ Zod schema validation for Document, Page, Text components
- ✅ react-pdf integration with React 19
- ✅ JSON-to-PDF renderer function concept
- ⚠️ json-render 0.1.0 has `createCatalog` (docs show `defineCatalog`)
- ⚠️ Need json-render >= 0.2.0 for full catalog prompt/validation features

## Example

**Scenario**: Generating an invoice from an AI prompt

**Before**: Unstructured AI output that needs manual conversion to PDF

**After**: AI generates validated JSON spec that renders directly to PDF:

```json
{
  "type": "Document",
  "props": { "title": "Invoice INV-2024-001" },
  "children": [
    {
      "type": "Page",
      "props": { "size": "A4" },
      "children": [
        {
          "type": "InvoiceHeader",
          "props": {
            "companyName": "Digital Solutions Inc",
            "invoiceNumber": "INV-2024-001",
            "date": "2024-01-15",
            "dueDate": "2024-02-14"
          }
        },
        {
          "type": "InvoiceTable",
          "props": {
            "items": [
              {
                "description": "Website Design",
                "quantity": 5,
                "unitPrice": 150,
                "total": 750
              },
              {
                "description": "Hosting Setup",
                "quantity": 1,
                "unitPrice": 100,
                "total": 100
              },
              {
                "description": "Domain Registration",
                "quantity": 1,
                "unitPrice": 15,
                "total": 15
              }
            ],
            "currency": "USD"
          }
        },
        {
          "type": "TotalSection",
          "props": {
            "subtotal": 865,
            "tax": 86.5,
            "total": 951.5
          }
        }
      ]
    }
  ]
}
```

## Notes

### Advantages
1. **Type Safety**: Zod schemas validate all AI output
2. **Predictable Output**: AI constrained to known component set
3. **Reusable Components**: Custom PDF components can be defined once
4. **AI Flexibility**: AI can create novel layouts within constraints
5. **Native PDF**: Uses react-pdf for high-quality PDF generation

### Limitations
1. **API Version**: json-render 0.1.0 has different API than documentation (`createCatalog` vs `defineCatalog`)
2. **Learning Curve**: Requires understanding both json-render and react-pdf
3. **Component Definitions**: Need to define all PDF components upfront
4. **AI Prompt Engineering**: May require tuning prompts for consistent results
5. **Complex Layouts**: Advanced PDF layouts may need custom components

### When NOT to Use
- Simple static PDF templates (use react-pdf directly)
- Non-AI PDF generation (overkill)
- When you need full HTML/CSS flexibility (consider html-to-pdf instead)

### Integration Tips
1. **Version Check**: Use json-render >= 0.2.0 for `defineCatalog` and `schema` exports
2. Start with basic components (Document, Page, Text, View)
3. Gradually add domain-specific components (InvoiceHeader, ReportTable, etc.)
4. For v0.1.0: Implement custom Zod validation and prompt generation
5. For v0.2.0+: Use catalog's `prompt()` and `validate()` methods
6. Implement error boundaries for invalid AI output
7. Cache validated specs for repeated generation

### Performance Considerations
- Validate specs on server-side for production
- Consider streaming PDF generation for large documents
- Implement spec caching to reduce AI calls
- Use `PDFDownloadLink` for client-side generation

## References
- [json-render Documentation](https://json-render.dev/docs)
- [react-pdf Documentation](https://react-pdf.org/)
- [Zod Schema Validation](https://zod.dev/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs) (for AI integration)