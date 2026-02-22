# PDF AI Generator

AI-powered PDF generation with JSON-Render and AI Assistant.

## Features

- **Natural Language → PDF**: Describe what you need, get a professional PDF
- **JSON-Render Integration**: Component catalog that maps JSON specs to React-PDF
- **AI Assistant**: Chat with AI to help create perfect PDF requests
- **Type-Safe**: Zod validation ensures AI output is correct

## Quick Start

```
https://pdf-ai-generator.exe.xyz:3005
```

## API Endpoints

### Complete Workflow
```bash
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/complete-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "pdfType": "invoice",
    "description": "Invoice for $500 web design services"
  }' \
  --output invoice.pdf
```

### AI Assistant
```bash
# Chat with AI
curl -X POST https://pdf-ai-generator.exe.xyz:3005/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I need an invoice"}'

# Get PDF types
curl https://pdf-ai-generator.exe.xyz:3005/api/assistant/types
```

### JSON-Render
```bash
# Get component catalog
curl https://pdf-ai-generator.exe.xyz:3005/api/json-render/catalog
```

## Architecture

```
User Request → AI Assistant → JSON Spec → JSON-Render → React-PDF → PDF
```

## Tech Stack

- **AI**: Deepseek API
- **PDF**: React-PDF
- **Validation**: Zod
- **Server**: Express.js
- **Language**: TypeScript

## License

MIT
