import OpenAI from 'openai';

export class DeepseekReal {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  async generatePdfJson(prompt: string): Promise<any> {
    try {
      console.log('Calling Deepseek API...');

      // Split system prompt from user prompt if combined with double newline separator
      let systemContent = 'You are a PDF document generator. Return ONLY valid JSON. No explanations.';
      let userContent = prompt;

      // If the prompt contains our SPEC_SYSTEM_PROMPT, the server concatenated system + user
      // We split on the last "Generate a " to separate them
      const splitIndex = prompt.lastIndexOf('\nGenerate a ');
      if (splitIndex > 200) {
        systemContent = prompt.substring(0, splitIndex).trim();
        userContent = prompt.substring(splitIndex).trim();
      }

      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
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
        throw new Error('No response from Deepseek');
      }

      console.log('Deepseek response received (' + content.length + ' chars)');

      // Clean the response
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      return JSON.parse(cleaned);

    } catch (error: any) {
      console.error('Deepseek API error:', error.message);
      throw new Error('AI generation failed: ' + error.message);
    }
  }

  // Generic call method used by AIAssistant
  async call(prompt: string, _messages: any[]): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
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
    const prompt = 'Generate a ' + pdfType + ' PDF document JSON.\n\n' +
      'REQUIREMENTS:\n' + description + '\n\n' +
      'Return ONLY valid JSON.';

    return this.generatePdfJson(prompt);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say "Hello"' }],
        max_tokens: 10,
      });
      return !!response.choices[0]?.message?.content;
    } catch (error: any) {
      console.error('Deepseek test failed:', error.message);
      return false;
    }
  }
}
