import express from 'express';
import cors from 'cors';
import { generatePdfPrompt } from './src/ai/prompt-engine';
import { DocumentSchema } from './src/schemas/document';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'PDF AI Generator',
    version: '1.0.0',
    description: 'JSON-Render + React-PDF integration for AI-generated PDFs',
    endpoints: {
      '/api/generate-prompt': 'POST - Generate AI prompt for PDF creation',
      '/api/validate-spec': 'POST - Validate PDF JSON spec',
      '/api/health': 'GET - Health check'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
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

app.listen(port, () => {
  console.log('PDF AI Generator API running on http://localhost:' + port);
  console.log('Access via: https://pdf-ai-generator.exe.xyz');
});
