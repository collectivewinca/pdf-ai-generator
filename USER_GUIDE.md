# PDF AI Generator - User Guide

A powerful AI-powered PDF generation system that creates professional PDFs from natural language descriptions using Deepseek AI and React-PDF.

## Quick Start

### 1. Access the API

The PDF AI Generator is running at:
```
https://pdf-ai-generator.exe.xyz:3005
```

### 2. Health Check

Verify the system is running:
```bash
curl https://pdf-ai-generator.exe.xyz:3005/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-22T16:11:20.311Z",
  "deepseekAPI": "configured",
  "pdfRendering": "operational",
  "message": "PDF AI Generator is fully operational"
}
```

## API Endpoints

### Complete Workflow (Recommended)

Generate a PDF in one call:

```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/complete-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "pdfType": "invoice",
    "description": "Create an invoice for 5 hours of web development at $150/hour",
    "filename": "invoice.pdf"
  }' \
  --output invoice.pdf
```

### Generate JSON Spec Only

Get the AI-generated JSON specification without rendering:

```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/generate-with-ai \
  -H "Content-Type: application/json" \
  -d '{
    "pdfType": "report",
    "description": "Monthly sales report for January 2024"
  }'
```

### Validate JSON Spec

Check if a JSON spec is valid:

```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/validate-spec \
  -H "Content-Type: application/json" \
  -d '{
    "spec": {
      "type": "Document",
      "props": { "title": "Test" },
      "children": []
    }
  }'
```

### Render PDF from JSON

Render a PDF from an existing JSON spec:

```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/render-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "spec": { ...your JSON spec... }
  }' \
  --output document.pdf
```

### Test PDF Generation

Generate a simple test PDF:

```bash
curl https://pdf-ai-generator.exe.xyz:3005/api/test-pdf --output test.pdf
```

## PDF Types

You can generate various types of PDFs by specifying the `pdfType`:

### 1. Invoice

```json
{
  "pdfType": "invoice",
  "description": "Invoice for 10 hours of consulting at $200/hour"
}
```

### 2. Report

```json
{
  "pdfType": "report",
  "description": "Annual financial report with charts and tables"
}
```

### 3. Receipt

```json
{
  "pdfType": "receipt",
  "description": "Receipt for online purchase of $49.99"
}
```

### 4. Letter

```json
{
  "pdfType": "letter",
  "description": "Formal business letter to a client"
}
```

### 5. Contract

```json
{
  "pdfType": "contract",
  "description": "Service agreement between company and client"
}
```

### 6. Presentation

```json
{
  "pdfType": "presentation",
  "description": "Quarterly business review slides"
}
```

## Example: Complete Invoice Generation

### Step 1: Create Invoice Request

```bash
cat > request.json << 'EOF'
{
  "pdfType": "invoice",
  "description": "Create a professional invoice for:
    - Company: Tech Solutions Inc.
    - Invoice #: INV-2024-001
    - Date: February 22, 2026
    - Services: Web Development (20 hours at $150/hour = $3,000)
    - Include: Company address, client details, itemized list, subtotal, tax (10%), total"
}
EOF
```

### Step 2: Generate PDF

```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/complete-workflow \
  -H "Content-Type: application/json" \
  -d @request.json \
  --output invoice-2024-001.pdf
```

### Step 3: Verify

```bash
# Check file exists
ls -la invoice-2024-001.pdf

# Verify it's a valid PDF
head -c 10 invoice-2024-001.pdf
# Should output: %PDF-1.3
```

## JSON Spec Format

The AI generates JSON specs in this format:

```json
{
  "type": "Document",
  "props": {
    "title": "Invoice",
    "author": "Your Company Name",
    "subject": "Invoice Description"
  },
  "children": [
    {
      "type": "Page",
      "props": {
        "size": "A4",
        "orientation": "portrait"
      },
      "children": [
        {
          "type": "Text",
          "props": {
            "children": "Your text content here",
            "style": {
              "fontSize": 24,
              "fontWeight": "bold",
              "textAlign": "center",
              "marginTop": 20
            }
          }
        },
        {
          "type": "View",
          "props": {
            "style": {
              "padding": 20,
              "backgroundColor": "#f5f5f5"
            }
          },
          "children": [
            // More components
          ]
        }
      ]
    }
  ]
}
```

### Available Components

- **Document** - Root component with metadata
- **Page** - Individual pages (A4, Letter, Legal sizes)
- **Text** - Text content with styling
- **View** - Container for grouping elements

### Text Styles

```json
{
  "fontSize": 12,
  "fontWeight": "bold",
  "color": "#000000",
  "textAlign": "left|center|right",
  "marginTop": 10,
  "marginBottom": 10,
  "padding": 20,
  "backgroundColor": "#ffffff"
}
```

## Troubleshooting

### Connection Issues

If you can't reach the server:
```bash
# Check if server is running
ssh pdf-ai-generator.exe.xyz "curl http://localhost:3005/api/health"
```

### PDF Not Generating

Check server logs:
```bash
ssh pdf-ai-generator.exe.xyz "tail -50 /tmp/server.log"
```

### Invalid JSON Spec

The AI may generate invalid specs. Use the validation endpoint:
```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/validate-spec \
  -H "Content-Type: application/json" \
  -d '{"spec": {...}}'
```

## Programming Examples

### Node.js

```javascript
const fs = require('fs');

async function generateInvoice() {
  const response = await fetch('https://pdf-ai-generator.exe.xyz:3005/api/complete-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdfType: 'invoice',
      description: 'Invoice for consulting services'
    })
  });

  const buffer = await response.arrayBuffer();
  fs.writeFileSync('invoice.pdf', Buffer.from(buffer));
}

generateInvoice();
```

### Python

```python
import requests

def generate_pdf():
    response = requests.post(
        'https://pdf-ai-generator.exe.xyz:3005/api/complete-workflow',
        json={
            'pdfType': 'invoice',
            'description': 'Invoice for consulting services'
        }
    )
    
    with open('invoice.pdf', 'wb') as f:
        f.write(response.content)

generate_pdf()
```

### JavaScript (Browser)

```javascript
async function generatePDF() {
  const response = await fetch('https://pdf-ai-generator.exe.xyz:3005/api/complete-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdfType: 'invoice',
      description: 'Invoice for consulting services'
    })
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  // Open in new tab
  window.open(url, '_blank');
}
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/api/health` | GET | Health check |
| `/api/test-deepseek` | GET | Test AI connection |
| `/api/test-pdf` | GET | Test PDF generation |
| `/api/generate-prompt` | POST | Generate AI prompt |
| `/api/validate-spec` | POST | Validate JSON spec |
| `/api/generate-with-ai` | POST | Generate JSON with AI |
| `/api/render-pdf` | POST | Render PDF from JSON |
| `/api/complete-workflow` | POST | Complete AI→PDF workflow |

## Support

For issues or questions:
1. Check server logs: `ssh pdf-ai-generator.exe.xyz "tail -50 /tmp/server.log"`
2. Test API locally: `curl http://localhost:3005/api/health`
3. Review this guide for common solutions

---
**Version:** 4.0.0  
**Last Updated:** February 22, 2026
