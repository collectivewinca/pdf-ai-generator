import { DeepseekReal } from '../ai/deepseek-real';

// AI Assistant helps users create PDF requests
export class AIAssistant {
  private deepseek: DeepseekReal;

  constructor(apiKey: string) {
    this.deepseek = new DeepseekReal(apiKey);
  }

  // Understand user's request and suggest the best approach
  async understandRequest(userMessage: string): Promise<{
    pdfType: string;
    description: string;
    suggestions: string[];
    confidence: number;
  }> {
    const prompt = `You are a helpful PDF creation assistant. Analyze the user's request and suggest the best PDF type and description.

Available PDF types:
- invoice: Bills, invoices, quotes
- receipt: Payment confirmations, purchase receipts  
- letter: Business letters, formal correspondence
- report: Data reports, summaries, analysis
- contract: Agreements, legal documents
- presentation: Slides, decks

User's request: "${userMessage}"

Respond with ONLY valid JSON (no other text):
{
  "pdfType": "the best matching type from the list above",
  "description": "a clear, detailed description that will generate a good PDF",
  "suggestions": ["any helpful tips or additional info to include"],
  "confidence": 0.0-1.0 how confident you are in this match
}`;

    try {
      const response = await this.deepseek.call(prompt, []);
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON in response');
    } catch (error: any) {
      return {
        pdfType: 'document',
        description: userMessage,
        suggestions: ['Try being more specific about what you need'],
        confidence: 0.3
      };
    }
  }

  // Improve a description
  async improveDescription(description: string, pdfType: string): Promise<{
    improved: string;
    additions: string[];
  }> {
    const prompt = `Improve this PDF description to make it generate a better result.

Current description: "${description}"
PDF type: ${pdfType}

Respond with ONLY valid JSON:
{
  "improved": "an improved, more detailed description",
  "additions": ["specific suggestions added to improve the PDF"]
}`;

    try {
      const response = await this.deepseek.call(prompt, []);
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { improved: description, additions: [] };
    } catch (error: any) {
      return { improved: description, additions: [] };
    }
  }

  // Generate a complete request from natural language
  async generateRequest(userMessage: string): Promise<{
    pdfType: string;
    description: string;
    filename: string;
    tips: string[];
  }> {
    const prompt = `You are a PDF creation assistant. Generate a complete, ready-to-use PDF request from this user message.

User message: "${userMessage}"

Respond with ONLY valid JSON:
{
  "pdfType": "the best PDF type (invoice, receipt, letter, report, contract, presentation)",
  "description": "a detailed description for the AI to generate the PDF",
  "filename": "a good default filename (e.g., invoice-2024-001.pdf)",
  "tips": ["helpful tips for the user about this PDF"]
}`;

    try {
      const response = await this.deepseek.call(prompt, []);
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON');
    } catch (error: any) {
      return {
        pdfType: 'document',
        description: userMessage,
        filename: 'document.pdf',
        tips: ['Your request has been processed']
      };
    }
  }

  // Chat with the assistant
  async chat(message: string, context?: string): Promise<{
    response: string;
    action?: {
      type: 'generate_pdf' | 'improve' | 'suggest';
      data: any;
    };
  }> {
    const contextStr = context ? `\nCurrent context: ${context}` : '';
    
    const prompt = `You are a friendly PDF creation assistant. Help the user create PDFs.

User message: "${message}"${contextStr}

Respond with ONLY valid JSON:
{
  "response": "your helpful response to the user",
  "action": {
    "type": "generate_pdf" | "improve" | "suggest" | null,
    "data": {}
  }
}`;

    try {
      const response = await this.deepseek.call(prompt, []);
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        response: "I'd be happy to help you create a PDF! Just tell me what you need.",
        action: undefined
      };
    } catch (error: any) {
      return {
        response: "I'm here to help! Just describe what kind of PDF you need.",
        action: undefined
      };
    }
  }
}

// Available PDF types with descriptions
export const pdfTypes = [
  { type: 'invoice', name: 'Invoice', emoji: '🧾', description: 'Bills, quotes, pro formas' },
  { type: 'receipt', name: 'Receipt', emoji: '🧾', description: 'Payment confirmations' },
  { type: 'letter', name: 'Letter', emoji: '📄', description: 'Business correspondence' },
  { type: 'report', name: 'Report', emoji: '📊', description: 'Data, summaries, analysis' },
  { type: 'contract', name: 'Contract', emoji: '📝', description: 'Agreements, legal docs' },
  { type: 'presentation', name: 'Presentation', emoji: '📑', description: 'Slides, decks' }
];

// Example prompts for each type
export const examplePrompts: Record<string, string[]> = {
  invoice: [
    'Invoice for 10 hours consulting at $200/hour',
    'Quote for website redesign project',
    'Pro forma invoice for $5,000'
  ],
  receipt: [
    'Receipt for $50 payment received',
    'Purchase receipt for products',
    'Payment confirmation for services'
  ],
  letter: [
    'Welcome letter to new customers',
    'Follow-up after meeting',
    'Formal letter to vendor'
  ],
  report: [
    'Monthly sales report January 2026',
    'Quarterly financial summary',
    'Project status report'
  ],
  contract: [
    'Freelance service agreement',
    'NDA between companies',
    'Service level agreement'
  ],
  presentation: [
    'Quarterly business review slides',
    'Product launch deck',
    'Team meeting presentation'
  ]
};
