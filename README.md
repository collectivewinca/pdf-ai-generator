# PDF AI Generator

AI-powered PDF generation using JSON-Render (Vercel Labs Generative UI) and React-PDF.

## 🚀 Live Deployment

**Access URLs:**
- **API**: https://pdf-ai-generator.exe.xyz
- **SSH**: `ssh pdf-ai-generator.exe.xyz`
- **Project Location**: `/root/pdf-ai-generator/`

## 📋 Features

✅ **Complete PDF → AI → PDF Workflow**
- PDF analysis and metadata extraction
- JSON spec generation with Zod validation
- AI prompt engineering for PDF generation
- React-PDF rendering integration

✅ **Type-Safe PDF Components**
- Document, Page, Text schemas with Zod
- JSON-Render catalog for UI generation
- React-PDF renderer adapter

✅ **Production-Ready API**
- Health check endpoint
- Prompt generation endpoint
- Spec validation endpoint
- CORS enabled

✅ **Tested Integration**
- Unit tests with Vitest
- Integration tests for complete workflow
- Example implementations

## 🏗️ Architecture

```
PDF → Analysis → JSON Spec → AI Prompt → PDF
    ↓           ↓           ↓           ↓
  pdf-parse   Zod schemas  Prompt     React-PDF
              ↓           Engine      Renderer
           Validation
```

## 📁 Project Structure

```
src/
├── schemas/           # Zod schemas for PDF components
│   ├── document.ts
│   ├── page.ts
│   └── text.ts
├── catalog/           # JSON-Render catalog definitions
│   └── pdf-catalog.ts
├── renderer/          # React-PDF renderer adapter
│   └── pdf-renderer.tsx
├── ai/                # AI prompt engine
│   └── prompt-engine.ts
├── index.ts           # Main entry point
└── test-integration.ts # Complete workflow test

examples/
├── invoice-example.ts
└── report-example.ts

tests/
└── integration.test.ts

server.ts              # Express API server
```

## 🚀 Quick Start

### 1. Access the VM
```bash
ssh pdf-ai-generator.exe.xyz
cd /root/pdf-ai-generator
```

### 2. Run Examples
```bash
# Generate invoice example
npm run example:invoice

# Generate report example  
npm run example:report

# Run tests
npm test
```

### 3. Use the API
```bash
# Health check
curl https://pdf-ai-generator.exe.xyz/api/health

# Generate AI prompt
curl -X POST https://pdf-ai-generator.exe.xyz/api/generate-prompt \
  -H 'Content-Type: application/json' \
  -d '{"pdfType": "invoice", "description": "Create invoice for consulting"}'

# Validate JSON spec
curl -X POST https://pdf-ai-generator.exe.xyz/api/validate-spec \
  -H 'Content-Type: application/json' \
  -d '{"spec": {"type": "Document", "props": {"title": "Test"}, "children": []}}'
```

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/api/health` | GET | Health check |
| `/api/generate-prompt` | POST | Generate AI prompt for PDF creation |
| `/api/validate-spec` | POST | Validate PDF JSON spec |

## 📚 Usage Examples

### 1. PDF Analysis Workflow
```typescript
import { analyzePdf } from './src/pdf-analysis';
import { generatePdfPrompt } from './src/ai/prompt-engine';

// Analyze existing PDF
const pdfData = await analyzePdf('path/to/invoice.pdf');
// pdfData: { title, pages, text, metadata }

// Generate AI prompt for similar PDF
const prompt = generatePdfPrompt('invoice', 'Create similar invoice');
```

### 2. JSON Spec Generation
```typescript
import { DocumentSchema } from './src/schemas/document';

const spec = {
  type: 'Document',
  props: { title: 'Invoice #001' },
  children: [
    {
      type: 'Page',
      props: { size: 'A4' },
      children: [
        {
          type: 'Text',
          props: { children: 'Invoice Details' }
        }
      ]
    }
  ]
};

// Validate spec
const result = DocumentSchema.safeParse(spec);
if (result.success) {
  console.log('Valid spec:', result.data);
}
```

### 3. React-PDF Rendering
```typescript
import { PdfRenderer } from './src/renderer/pdf-renderer';
import { DocumentSchema } from './src/schemas/document';

// Render PDF from JSON spec
const pdfBlob = await PdfRenderer.render(spec);
// Save or display the PDF
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration test
npx tsx src/test-integration.ts
```

## 🔄 Development

```bash
# Install dependencies
npm install

# Start development server
npm run server

# Build project
npm run build

# Lint code
npm run lint
```

## 📊 Supported PDF Types

1. **Invoices**
   - Line items, totals, taxes
   - Company details, payment terms
   - Dates and invoice numbers

2. **Reports**
   - Sections and headings
   - Data tables and charts
   - Executive summaries

3. **Presentations/Decks**
   - Slides with titles
   - Branding and logos
   - Bullet points and images

## 🛠️ Dependencies

- **@json-render/react**: Vercel Labs Generative UI framework
- **@react-pdf/renderer**: PDF generation library
- **zod**: Type-safe schema validation
- **pdf-parse**: PDF text extraction
- **express**: API server framework

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact: alet@chefaid.nyc

---

**Built with ❤️ by VE LAB**