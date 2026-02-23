import express from 'express';
import cors from 'cors';
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
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'PDF AI Generator',
    version: '2.0.0',
    description: 'JSON-Render + React-PDF integration for AI-generated PDFs',
    endpoints: {
      '/api/health': 'GET - Health check',
      '/api/generate-prompt': 'POST - Generate AI prompt for PDF creation',
      '/api/validate-spec': 'POST - Validate PDF JSON spec',
      '/api/assistant/chat': 'POST - Chat with AI assistant',
      '/api/complete-workflow': 'POST - Full pipeline: describe → AI → PDF spec'
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

// --- New endpoints ---

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
      // Natural language → structured request
      const request = await assistant.generateRequest(message);
      resolvedType = request.pdfType;
      resolvedDescription = request.description;
      filename = request.filename;
    } else {
      resolvedType = pdfType || 'document';
      resolvedDescription = description;
      filename = resolvedType + '.pdf';
    }

    // Generate PDF JSON spec via Deepseek
    const pdfSpec = await deepseek.generatePdfFromDescription(
      resolvedType,
      resolvedDescription
    );

    // Validate the spec
    const validation = DocumentSchema.safeParse(pdfSpec);

    res.json({
      pdfType: resolvedType,
      description: resolvedDescription,
      filename,
      spec: pdfSpec,
      valid: validation.success,
      errors: validation.success
        ? []
        : validation.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Workflow failed: ' + error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('PDF AI Generator API running on http://0.0.0.0:' + port);
  console.log('AI enabled: ' + !!deepseekKey);
});
