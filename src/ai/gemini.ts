import OpenAI from 'openai';

export class GeminiProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.5-pro') {
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  async generatePdfJson(prompt: string): Promise<any> {
    try {
      console.log('Calling Gemini API (' + this.model + ')...');

      let systemContent = 'You are a PDF document generator. Return ONLY valid JSON. No explanations.';
      let userContent = prompt;

      const splitIndex = prompt.lastIndexOf('\nGenerate a ');
      if (splitIndex > 200) {
        systemContent = prompt.substring(0, splitIndex).trim();
        userContent = prompt.substring(splitIndex).trim();
      }

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent }
        ],
        temperature: 0.3,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Gemini');
      }

      console.log('Gemini response received (' + content.length + ' chars)');

      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
      cleaned = cleaned.trim();

      return JSON.parse(cleaned);
    } catch (error: any) {
      console.error('Gemini API error:', error.message);
      throw new Error('AI generation failed: ' + error.message);
    }
  }

  async call(prompt: string, _messages: any[]): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful PDF creation assistant. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      return response.choices[0]?.message?.content || '{}';
    } catch (error: any) {
      throw new Error('AI call failed: ' + error.message);
    }
  }

  async generatePdfFromDescription(pdfType: string, description: string): Promise<any> {
    const prompt = 'Generate a ' + pdfType + ' PDF document JSON.\n\nREQUIREMENTS:\n' + description + '\n\nReturn ONLY valid JSON.';
    return this.generatePdfJson(prompt);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Say "Hello"' }],
        max_tokens: 10,
      });
      return !!response.choices[0]?.message?.content;
    } catch (error: any) {
      console.error('Gemini test failed:', error.message);
      return false;
    }
  }
}
