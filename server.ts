import express from 'express';
import path from 'path';
import cors from 'cors';
import { createCatalog, generateCatalogPrompt } from '@json-render/core';
import { renderToBuffer, renderToStream, standardComponentDefinitions, defineRegistry, schema } from '@json-render/react-pdf';
import { AIAssistant, pdfTypes, examplePrompts } from './src/ai-assistant/index';
import { DeepseekReal } from './src/ai/deepseek-real';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;

const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
const assistant = deepseekKey ? new AIAssistant(deepseekKey) : null;
const deepseek = deepseekKey ? new DeepseekReal(deepseekKey) : null;
const signatureRuntimeUrl = process.env.SIGNATURE_RUNTIME_URL || 'http://127.0.0.1:3210';
const renderApiKey = process.env.RENDER_API_KEY || '';

const signatureHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (renderApiKey) {
    headers['X-Render-Key'] = renderApiKey;
  }
  return headers;
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// --- json-render Catalog ---

const catalog = createCatalog({
  name: 'pdf-ai-generator',
  components: standardComponentDefinitions,
  actions: {}
});

const catalogPrompt = generateCatalogPrompt(catalog);

// Build the system prompt that tells the AI how to generate specs
const SPEC_SYSTEM_PROMPT = `You are a PDF document generator. You output ONLY valid JSON specs for a PDF rendering engine.

The spec format is a flat element map:
{
  "root": "<id of root element>",
  "elements": {
    "<id>": { "type": "<ComponentType>", "props": { ... }, "children": ["<child-id>", ...] },
    ...
  }
}

RULES:
- "root" must point to a Document element
- Every element has a unique string id (use short descriptive names like "doc", "page1", "title", "items-table")
- "children" is an array of element ids (NOT nested objects)
- Elements with no children use an empty array: "children": []
- Use descriptive, meaningful element ids

${catalogPrompt}

IMPORTANT: Return ONLY the JSON spec. No explanations, no markdown fences.`;

// --- Routes ---

// Landing page served by express.static('public')
// JSON info endpoint moved to /api/info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'PDF AI Generator',
    version: '4.0.0',
    engine: 'json-render + react-pdf',
    description: 'AI-generated PDFs via json-render catalog with standard components',
    components: Object.keys(standardComponentDefinitions),
    endpoints: {
      '/api/health': 'GET - Health check',
      '/api/catalog': 'GET - View available PDF components and their props',
      '/api/assistant/types': 'GET - List supported PDF document types',
      '/api/assistant/chat': 'POST - Chat with AI assistant',
      '/api/render': 'POST - Render a json-render spec to PDF file',
      '/api/signature/compositions': 'GET - List available signature runtime compositions',
      '/api/signature/render': 'POST - Render signature/stamp asset via ve-animesign runtime',
      '/api/generate': 'POST - Full pipeline: describe → AI → PDF file',
      '/api/complete-workflow': 'POST - Full pipeline: describe → AI → JSON spec (no render)'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '4.0.0',
    engine: 'json-render',
    timestamp: new Date().toISOString(),
    aiEnabled: !!deepseekKey,
    components: Object.keys(standardComponentDefinitions).length
  });
});

// Expose the catalog for inspection
app.get('/api/catalog', (req, res) => {
  res.json({
    components: Object.keys(standardComponentDefinitions),
    prompt: catalogPrompt
  });
});

app.get('/api/assistant/types', (req, res) => {
  res.json({
    types: pdfTypes,
    examples: examplePrompts
  });
});

app.get('/api/signature/compositions', async (req, res) => {
  try {
    const response = await fetch(`${signatureRuntimeUrl}/compositions`, {
      headers: signatureHeaders()
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || 'Failed to fetch signature compositions'
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Signature runtime unavailable',
      detail: error.message
    });
  }
});

app.post('/api/signature/render', async (req, res) => {
  try {
    const response = await fetch(`${signatureRuntimeUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signatureHeaders()
      },
      body: JSON.stringify(req.body || {})
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || 'Signature render failed',
        requestId: data?.requestId
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(502).json({
      error: 'Signature runtime unavailable',
      detail: error.message
    });
  }
});

// Chat with AI assistant
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

// Render a json-render spec to PDF
app.post('/api/render', async (req, res) => {
  try {
    const { spec, filename } = req.body;
    if (!spec || !spec.root || !spec.elements) {
      return res.status(400).json({
        error: 'Missing or invalid spec. Requires { root: string, elements: { ... } }'
      });
    }

    console.log('Rendering PDF from json-render spec...');
    const buffer = await renderToBuffer(spec);
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    const name = filename || 'document.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (error: any) {
    console.error('Render error:', error.message);
    res.status(500).json({ error: 'PDF render failed: ' + error.message });
  }
});

// Full pipeline: describe → AI → rendered PDF file
app.post('/api/generate', async (req, res) => {
  if (!deepseek) {
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

    if (message && assistant) {
      const request = await assistant.generateRequest(message);
      resolvedType = request.pdfType;
      resolvedDescription = request.description;
      filename = request.filename;
    } else {
      resolvedType = pdfType || 'document';
      resolvedDescription = description || message || '';
      filename = (resolvedType || 'document') + '.pdf';
    }

    console.log('Generating PDF spec via AI (' + resolvedType + ')...');
    const userPrompt = `Generate a ${resolvedType} PDF document.\n\nREQUIREMENTS:\n${resolvedDescription}\n\nGenerate the JSON spec now:`;
    const pdfSpec = await deepseek.generatePdfJson(SPEC_SYSTEM_PROMPT + '\n\n' + userPrompt);

    console.log('Rendering PDF via json-render...');
    const buffer = await renderToBuffer(pdfSpec);
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

// Full pipeline → JSON spec only (no render)
app.post('/api/complete-workflow', async (req, res) => {
  if (!deepseek) {
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

    if (message && assistant) {
      const request = await assistant.generateRequest(message);
      resolvedType = request.pdfType;
      resolvedDescription = request.description;
      filename = request.filename;
    } else {
      resolvedType = pdfType || 'document';
      resolvedDescription = description || message || '';
      filename = (resolvedType || 'document') + '.pdf';
    }

    console.log('Generating PDF spec via AI (' + resolvedType + ')...');
    const userPrompt = `Generate a ${resolvedType} PDF document.\n\nREQUIREMENTS:\n${resolvedDescription}\n\nGenerate the JSON spec now:`;
    const pdfSpec = await deepseek.generatePdfJson(SPEC_SYSTEM_PROMPT + '\n\n' + userPrompt);

    res.json({
      pdfType: resolvedType,
      description: resolvedDescription,
      filename,
      spec: pdfSpec
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Workflow failed: ' + error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('PDF AI Generator API v4 (json-render) running on http://0.0.0.0:' + port);
  console.log('AI enabled: ' + !!deepseekKey);
  console.log('Components: ' + Object.keys(standardComponentDefinitions).join(', '));
});
