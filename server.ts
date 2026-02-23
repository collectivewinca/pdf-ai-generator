import express from 'express';
import cors from 'cors';
import React from 'react';
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { generatePdfPrompt } from './src/ai/prompt-engine';
import { DocumentSchema } from './src/schemas/document';
import { AIAssistant } from './src/ai-assistant/index';
import { DeepseekReal } from './src/ai/deepseek-real';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;

const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
const assistant = deepseekKey ? new AIAssistant(deepseekKey) : null;
const deepseek = deepseekKey ? new DeepseekReal(deepseekKey) : null;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- PDF Rendering ---

// Convert a JSON spec node to a React element for react-pdf
function specToReactElement(node: any, key: number = 0): React.ReactElement | null {
  if (!node || !node.type) return null;

  const t = node.type;
  const props = node.props || {};
  const children = node.children || [];

  if (t === 'Document') {
    return React.createElement(
      Document,
      { key, title: props.title, author: props.author, subject: props.subject },
      ...children.map((c: any, i: number) => specToReactElement(c, i)).filter(Boolean)
    );
  }

  if (t === 'Page') {
    return React.createElement(
      Page,
      { key, size: props.size || 'A4', orientation: props.orientation || 'portrait', style: props.style },
      ...children.map((c: any, i: number) => specToReactElement(c, i)).filter(Boolean)
    );
  }

  if (t === 'View') {
    return React.createElement(
      View,
      { key, style: props.style },
      ...children.map((c: any, i: number) => specToReactElement(c, i)).filter(Boolean)
    );
  }

  if (t === 'Text') {
    return React.createElement(
      Text,
      { key, style: props.style },
      props.children || ''
    );
  }

  // Unknown type — render as Text fallback
  return React.createElement(Text, { key }, `[${t}]`);
}

async function renderSpecToPdf(spec: any): Promise<Buffer> {
  const element = specToReactElement(spec);
  if (!element) throw new Error('Failed to convert spec to React elements');
  return await renderToBuffer(element);
}

// --- Routes ---

app.get('/', (req, res) => {
  res.json({
    name: 'PDF AI Generator',
    version: '3.0.0',
    description: 'JSON-Render + React-PDF integration for AI-generated PDFs',
    endpoints: {
      '/api/health': 'GET - Health check',
      '/api/generate-prompt': 'POST - Generate AI prompt for PDF creation',
      '/api/validate-spec': 'POST - Validate PDF JSON spec',
      '/api/assistant/chat': 'POST - Chat with AI assistant',
      '/api/complete-workflow': 'POST - Full pipeline: describe → AI → PDF spec',
      '/api/render': 'POST - Render a PDF spec to a downloadable PDF file',
      '/api/generate': 'POST - Full pipeline + render: describe → AI → PDF file'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiEnabled: !!deepseekKey
  });
});

app.post('/api/generate-prompt', (req, res) => {
  try {
    const { pdfType, description } = req.body;
    if (!pdfType || !description) {
      return res.status(400).json({ error: 'Missing pdfType or description' });
    }
    const prompt = generatePdfPrompt(pdfType, description);
    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

app.post('/api/validate-spec', (req, res) => {
  try {
    const { spec } = req.body;
    if (!spec) {
      return res.status(400).json({ error: 'Missing spec' });
    }
    const result = DocumentSchema.safeParse(spec);
    if (result.success) {
      res.json({ valid: true, data: result.data });
    } else {
      res.json({
        valid: false,
        errors: result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.post('/api/assistant/chat', async (req, res) => {
  if (!assistant) {
    return res.status(503).json({
      error: 'AI assistant not configured',
      hint: 'Set DEEPSEEK_API_KEY environment variable'
    });
  }
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }
    const result = await assistant.chat(message, context);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Assistant chat failed: ' + error.message });
  }
});

app.post('/api/complete-workflow', async (req, res) => {
  if (!assistant || !deepseek) {
    return res.status(503).json({
      error: 'AI not configured',
      hint: 'Set DEEPSEEK_API_KEY environment variable'
    });
  }
  try {
    const { message, pdfType, description } = req.body;
    if (!message && !description) {
      return res.status(400).json({
        error: 'Provide either message (natural language) or pdfType + description'
      });
    }

    let resolvedType: string;
    let resolvedDescription: string;
    let filename: string;

    if (message) {
      const request = await assistant.generateRequest(message);
      resolvedType = request.pdfType;
      resolvedDescription = request.description;
      filename = request.filename;
    } else {
      resolvedType = pdfType || 'document';
      resolvedDescription = description;
      filename = resolvedType + '.pdf';
    }

    const pdfSpec = await deepseek.generatePdfFromDescription(resolvedType, resolvedDescription);
    const validation = DocumentSchema.safeParse(pdfSpec);

    res.json({
      pdfType: resolvedType,
      description: resolvedDescription,
      filename,
      spec: pdfSpec,
      valid: validation.success,
      errors: validation.success
        ? []
        : validation.error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Workflow failed: ' + error.message });
  }
});

// --- NEW: Render spec to PDF file ---

app.post('/api/render', async (req, res) => {
  try {
    const { spec, filename } = req.body;
    if (!spec) {
      return res.status(400).json({ error: 'Missing spec' });
    }

    console.log('Rendering PDF from spec...');
    const buffer = await renderSpecToPdf(spec);

    const name = filename || 'document.pdf';
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (error: any) {
    console.error('Render error:', error.message);
    res.status(500).json({ error: 'PDF render failed: ' + error.message });
  }
});

// --- NEW: Full pipeline — describe → AI → rendered PDF file ---

app.post('/api/generate', async (req, res) => {
  if (!assistant || !deepseek) {
    return res.status(503).json({
      error: 'AI not configured',
      hint: 'Set DEEPSEEK_API_KEY environment variable'
    });
  }
  try {
    const { message, pdfType, description } = req.body;
    if (!message && !description) {
      return res.status(400).json({
        error: 'Provide either message (natural language) or pdfType + description'
      });
    }

    let resolvedType: string;
    let resolvedDescription: string;
    let filename: string;

    if (message) {
      const request = await assistant.generateRequest(message);
      resolvedType = request.pdfType;
      resolvedDescription = request.description;
      filename = request.filename;
    } else {
      resolvedType = pdfType || 'document';
      resolvedDescription = description;
      filename = resolvedType + '.pdf';
    }

    console.log('Generating PDF spec via AI...');
    const pdfSpec = await deepseek.generatePdfFromDescription(resolvedType, resolvedDescription);

    console.log('Rendering PDF...');
    const buffer = await renderSpecToPdf(pdfSpec);
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (error: any) {
    console.error('Generate error:', error.message);
    res.status(500).json({ error: 'PDF generation failed: ' + error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('PDF AI Generator API v3 running on http://0.0.0.0:' + port);
  console.log('AI enabled: ' + !!deepseekKey);
});
