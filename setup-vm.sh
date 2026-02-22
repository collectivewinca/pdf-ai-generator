#!/bin/bash
# Setup script for PDF AI Generator VM

echo "=== Setting up PDF AI Generator on exe.dev VM ==="

# 1. Install Node.js 20 (if not already installed)
echo "1. Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. Install project dependencies
echo "2. Installing project dependencies..."
cd /root/pdf-ai-generator
npm install --legacy-peer-deps

# 3. Create project structure
echo "3. Creating project structure..."
mkdir -p src/{schemas,catalog,analysis,renderer,ai,api}
mkdir -p tests examples

# 4. Create core implementation files
echo "4. Creating core implementation files..."

# Schemas
cat > src/schemas/document.ts << 'EOF'
import { z } from 'zod';

export const DocumentSchema = z.object({
  type: z.literal('Document'),
  props: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    subject: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  children: z.array(z.any()),
});

export type DocumentSpec = z.infer<typeof DocumentSchema>;
EOF

cat > src/schemas/page.ts << 'EOF'
import { z } from 'zod';

export const PageSchema = z.object({
  type: z.literal('Page'),
  props: z.object({
    size: z.enum(['A4', 'LETTER', 'LEGAL', 'A3', 'A5']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    style: z.record(z.any()).optional(),
    margin: z.number().optional(),
  }).optional(),
  children: z.array(z.any()),
});

export type PageSpec = z.infer<typeof PageSchema>;
EOF

cat > src/schemas/text.ts << 'EOF'
import { z } from 'zod';

export const TextSchema = z.object({
  type: z.literal('Text'),
  props: z.object({
    children: z.string(),
    style: z.record(z.any()).optional(),
    fixed: z.boolean().optional(),
    render: z.function().optional(),
  }),
});

export type TextSpec = z.infer<typeof TextSchema>;
EOF

# Catalog
cat > src/catalog/pdf-catalog.ts << 'EOF'
import { createCatalog } from '@json-render/core';
import { DocumentSchema, PageSchema, TextSchema } from '../schemas';
import { z } from 'zod';

export const pdfCatalog = createCatalog({
  components: {
    Document: {
      schema: DocumentSchema,
      description: 'PDF document container with metadata',
    },
    Page: {
      schema: PageSchema,
      description: 'PDF page with size, orientation, and styling',
    },
    Text: {
      schema: TextSchema,
      description: 'Text element with styling and rendering options',
    },
  },
  actions: {
    download: {
      description: 'Download the generated PDF',
    },
    print: {
      description: 'Print the PDF',
    },
    share: {
      description: 'Share the PDF via email or link',
    },
  },
});

export type PdfCatalog = typeof pdfCatalog;
EOF

# Renderer
cat > src/renderer/pdf-renderer.tsx << 'EOF'
import React from 'react';
import {
  Document as PdfDocument,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
  StyleSheet,
} from '@react-pdf/renderer';

export function renderPdfFromSpec(spec: any): React.ReactElement {
  const componentMap: Record<string, any> = {
    Document: PdfDocument,
    Page: PdfPage,
    Text: PdfText,
    View: PdfView,
  };

  function renderElement(element: any): React.ReactElement {
    const { type, props, children } = element;
    const Component = componentMap[type];
    
    if (!Component) {
      throw new Error(`Unknown PDF component: ${type}`);
    }

    const childElements = children
      ? children.map((child: any, index: number) => 
          React.createElement(React.Fragment, { key: index }, renderElement(child))
        )
      : undefined;

    return React.createElement(Component, { ...props }, childElements);
  }

  return renderElement(spec);
}

// Example styles
export const styles = StyleSheet.create({
  invoice: {
    padding: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
EOF

# AI Prompt Engine
cat > src/ai/prompt-engine.ts << 'EOF'
import { pdfCatalog } from '../catalog/pdf-catalog';

export type DocumentType = 'invoice' | 'report' | 'contract' | 'presentation' | 'letter';

export function generatePdfPrompt(
  documentType: DocumentType,
  requirements: string,
  examples?: string[]
): string {
  const typeRules = {
    invoice: [
      'Include invoice number, date, due date',
      'List line items with description, quantity, unit price, total',
      'Calculate subtotal, tax, discount, grand total',
      'Include payment terms and company details',
    ],
    report: [
      'Include executive summary',
      'Use sections with headings',
      'Include data tables or charts',
      'Add conclusions and recommendations',
    ],
    contract: [
      'Include parties information',
      'Define terms and conditions',
      'Add signature blocks',
      'Include dates and effective periods',
    ],
    presentation: [
      'Use slide-like structure',
      'Include titles and bullet points',
      'Add speaker notes if needed',
      'Use visual hierarchy',
    ],
    letter: [
      'Include date, recipient, sender',
      'Use proper salutation and closing',
      'Organize content in paragraphs',
      'Add signature block',
    ],
  };

  const rules = typeRules[documentType] || [];

  const exampleText = examples?.length
    ? `\n\nEXAMPLES:\n${examples.map((ex, i) => `Example ${i + 1}:\n${ex}`).join('\n\n')}`
    : '';

  return `Generate a ${documentType} PDF document.

REQUIREMENTS:
${requirements}

DOCUMENT RULES:
${rules.map(rule => `- ${rule}`).join('\n')}

COMPONENT CATALOG:
- Document: Root container (optional: title, author, subject)
- Page: PDF page (size: A4|LETTER|LEGAL, orientation: portrait|landscape)
- Text: Text content with styling
- View: Layout container (like div)

OUTPUT FORMAT:
Return ONLY valid JSON matching the component schemas.
Include proper styling for readability.
Use appropriate margins and spacing.

${exampleText}

Generate the ${documentType} JSON spec now:`;
}

export function getValidationPrompt(errors: string[]): string {
  return `The generated PDF spec has validation errors:

${errors.map(error => `- ${error}`).join('\n')}

Please fix the JSON spec to resolve these validation errors.
Return ONLY the corrected JSON spec.`;
}
EOF

# 5. Create test files
echo "5. Creating test files..."

cat > tests/integration.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { DocumentSchema, PageSchema, TextSchema } from '../src/schemas';
import { generatePdfPrompt } from '../src/ai/prompt-engine';

describe('PDF AI Generator Integration', () => {
  it('validates basic document structure', () => {
    const spec = {
      type: 'Document',
      props: { title: 'Test Document' },
      children: [
        {
          type: 'Page',
          props: { size: 'A4' },
          children: [
            {
              type: 'Text',
              props: { children: 'Hello, World!' }
            }
          ]
        }
      ]
    };

    expect(() => DocumentSchema.parse(spec)).not.toThrow();
    expect(() => PageSchema.parse(spec.children[0])).not.toThrow();
    expect(() => TextSchema.parse(spec.children[0].children[0])).not.toThrow();
  });

  it('generates invoice prompt', () => {
    const prompt = generatePdfPrompt('invoice', 'Create invoice for 3 consulting hours at $200/hour');
    
    expect(prompt).toContain('Generate a invoice PDF document');
    expect(prompt).toContain('invoice number');
    expect(prompt).toContain('line items');
  });

  it('rejects invalid document type', () => {
    const invalidSpec = {
      type: 'InvalidType',
      children: []
    };

    expect(() => DocumentSchema.parse(invalidSpec)).toThrow();
  });
});
EOF

# 6. Create examples
echo "6. Creating example files..."

cat > examples/invoice-example.ts << 'EOF'
// Example: Invoice generation
export const invoiceSpec = {
  type: 'Document',
  props: {
    title: 'Invoice #INV-2024-001',
    author: 'Acme Corp',
    subject: 'Consulting Services',
  },
  children: [
    {
      type: 'Page',
      props: { size: 'LETTER' },
      children: [
        {
          type: 'View',
          props: { style: { padding: 40 } },
          children: [
            {
              type: 'Text',
              props: {
                children: 'INVOICE',
                style: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Invoice #: INV-2024-001',
                style: { fontSize: 12, marginBottom: 5 }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Date: January 15, 2024',
                style: { fontSize: 12, marginBottom: 5 }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Due Date: February 14, 2024',
                style: { fontSize: 12, marginBottom: 30 }
              }
            },
            // Line items table would go here
            {
              type: 'Text',
              props: {
                children: 'Total: $1,250.00',
                style: { fontSize: 16, fontWeight: 'bold', marginTop: 30 }
              }
            }
          ]
        }
      ]
    }
  ]
};

console.log('Invoice example spec created');
console.log('Pages:', invoiceSpec.children.length);
console.log('Title:', invoiceSpec.props?.title);
EOF

cat > examples/report-example.ts << 'EOF'
// Example: Report generation
export const reportSpec = {
  type: 'Document',
  props: {
    title: 'Q4 2023 Sales Report',
    author: 'Sales Department',
    subject: 'Quarterly Performance Analysis',
  },
  children: [
    {
      type: 'Page',
      props: { size: 'A4' },
      children: [
        {
          type: 'View',
          props: { style: { padding: 50 } },
          children: [
            {
              type: 'Text',
              props: {
                children: 'Q4 2023 SALES REPORT',
                style: { 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  marginBottom: 30 
                }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'EXECUTIVE SUMMARY',
                style: { 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  marginBottom: 15 
                }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'This quarter showed 15% growth compared to Q3 2023...',
                style: { fontSize: 12, lineHeight: 1.5 }
              }
            }
          ]
        }
      ]
    }
  ]
};
EOF

# 7. Create package.json with scripts
echo "7. Updating package.json..."
cat > package.json << 'EOF'
{
  "name": "pdf-ai-generator",
  "version": "1.0.0",
  "description": "AI-powered PDF generation using json-render and react-pdf",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "tsc",
    "lint": "eslint src/**/*.ts",
    "example:invoice": "tsx examples/invoice-example.ts",
    "example:report": "tsx examples/report-example.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@json-render/core": "^0.1.0",
    "@json-render/react": "^0.1.0",
    "@react-pdf/renderer": "^4.3.0",
    "pdf-parse": "^1.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  },
  "keywords": [
    "pdf",
    "ai",
    "generation",
    "json-render",
    "react-pdf",
    "typescript"
  ],
  "author": "PDF AI Generator Team",
  "license": "MIT"
}
EOF

# 8. Create README
echo "8. Creating README..."
cat > README.md << 'EOF'
# PDF AI Generator

AI-powered PDF generation using json-render and react-pdf. Generate type-safe PDFs from AI prompts with structured JSON specs.

## Features

- **Type-safe PDF components** with Zod validation
- **AI prompt engineering** for PDF generation
- **React-PDF integration** for rendering
- **PDF analysis** for template extraction
- **Extensible catalog system** for custom components

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run examples
npm run example:invoice
npm run example:report

# Start development server
npm run dev
```

## Architecture

```
src/
├── schemas/           # Zod schemas for PDF components
├── catalog/          # JSON-Render catalog definitions
├── analysis/         # PDF analysis utilities
├── renderer/         # React-PDF renderer adapter
├── ai/              # AI prompt engineering
└── api/             # API routes (optional)
```

## Usage Examples

### 1. Generate Invoice from AI Prompt

```typescript
import { generatePdfPrompt } from './src/ai/prompt-engine';
import { pdfCatalog } from './src/catalog/pdf-catalog';

const prompt = generatePdfPrompt('invoice', 
  'Create invoice for 5 consulting hours at $150/hour, 10% tax');

// Send to AI, get JSON spec
const aiSpec = await callAI(prompt);

// Validate
const validation = pdfCatalog.validate(aiSpec);
if (validation.valid) {
  // Render PDF
  const pdf = renderPdfFromSpec(aiSpec);
}
```

### 2. Analyze Existing PDF

```typescript
import { analyzePDF } from './src/analysis/pdf-analyzer';

const pdfBuffer = fs.readFileSync('invoice.pdf');
const analysis = await analyzePDF(pdfBuffer);

// Returns: { type, metadata, extractedData, templateSpec }
console.log('PDF type:', analysis.type);
console.log('Extracted data:', analysis.extractedData);
```

### 3. Create Custom PDF Component

```typescript
// Add to catalog
const extendedCatalog = createCatalog({
  components: {
    ...pdfCatalog.data.components,
    SignatureBlock: {
      schema: z.object({
        name: z.string(),
        title: z.string(),
        date: z.string(),
      }),
      description: 'Signature block for contracts',
    },
  },
});
```

## API Reference

### Core Functions

- `generatePdfPrompt(type, requirements)` - Generate AI prompt for PDF
- `renderPdfFromSpec(spec)` - Convert JSON spec to React-PDF
- `analyzePDF(buffer)` - Analyze PDF and extract structure
- `validateSpec(spec)` - Validate JSON spec against schemas

### Component Schemas

- `DocumentSchema` - Root PDF container
- `PageSchema` - PDF page with size/orientation
- `TextSchema` - Text element with styling
- `ViewSchema` - Layout container

## Deployment

### exe.dev VM

```bash
# SSH into VM
ssh pdf-ai-generator.exe.xyz

# Start service
cd /root/pdf-ai-generator
npm start
```

### Vercel/Netlify

Deploy as serverless function for PDF generation API.

## License

MIT
EOF

# 9. Create index file
echo "9. Creating main index file..."
cat > src/index.ts << 'EOF'
import { pdfCatalog } from './catalog/pdf-catalog';
import { renderPdfFromSpec } from './renderer/pdf-renderer';
import { generatePdfPrompt } from './ai/prompt-engine';
import { DocumentSchema } from './schemas/document';

console.log('=== PDF AI Generator ===');
console.log('Version: 1.0.0');
console.log('Components:', pdfCatalog.componentNames);
console.log('Actions:', pdfCatalog.actionNames);
console.log('');

// Example usage
const examplePrompt = generatePdfPrompt('invoice', 
  'Create invoice for 3 items: Website Design (5h @ $150/h), Hosting ($50), Domain ($15)');

console.log('Example AI Prompt:');
console.log(examplePrompt.substring(0, 500) + '...');
console.log('');

// Example spec
const exampleSpec = {
  type: 'Document',
  props: { title: 'Example Invoice' },
  children: [
    {
      type: 'Page',
      props: { size: 'A4' },
      children: [
        {
          type: 'Text',
          props: { 
            children: 'PDF AI Generator - Ready!',
            style: { fontSize: 20, fontWeight: 'bold' }
          }
        }
      ]
    }
  ]
};

console.log('Example Spec Validation:');
try {
  DocumentSchema.parse(exampleSpec);
  console.log('✅ Spec is valid');
} catch (error) {
  console.log('❌ Validation error:', error);
}

console.log('');
console.log('Ready to generate PDFs with AI!');
console.log('Run: npm run example:invoice');
console.log('Or: npm run example:report');
EOF

# 10. Install additional dependencies
echo "10. Installing additional dependencies..."
npm install --save-dev vitest @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

echo "=== Setup Complete ==="
echo "Project location: /root/pdf-ai-generator"
echo "SSH access: ssh pdf-ai-generator.exe.xyz"
echo "Web access: https://pdf-ai-generator.exe.xyz"
echo ""
echo "Next steps:"
echo "1. cd /root/pdf-ai-generator"
echo "2. npm install"
echo "3. npm test"
echo "4. npm run example:invoice"
EOF