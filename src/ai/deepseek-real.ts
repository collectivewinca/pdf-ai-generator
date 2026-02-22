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
      
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a PDF document generator. Return ONLY valid JSON. No explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Deepseek');
      }
      
      console.log('Deepseek response received');
      
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
      
      // Parse JSON
      try {
        return JSON.parse(cleaned);
      } catch (parseError: any) {
        console.error('JSON parse error:', parseError.message);
        throw new Error('Failed to parse AI response as JSON');
      }
      
    } catch (error: any) {
      console.error('Deepseek API error:', error.message);
      throw new Error('AI generation failed: ' + error.message);
    }
  }
  
  async generatePdfFromDescription(pdfType: string, description: string): Promise<any> {
    const prompt = 'Generate a ' + pdfType + ' PDF document JSON.\n\n' +
      'REQUIREMENTS:\n' + description + '\n\n' +
      'DOCUMENT STRUCTURE:\n' +
      '- Document: Root with title, author, subject\n' +
      '- Page: Pages with size and orientation\n' +
      '- Text: Text with styling\n' +
      '- View: Layout containers\n\n' +
      'Return ONLY valid JSON matching:\n' +
      '{\n' +
      '  "type": "Document",\n' +
      '  "props": {\n' +
      '    "title": "Title",\n' +
      '    "author": "Author",\n' +
      '    "subject": "Subject"\n' +
      '  },\n' +
      '  "children": [\n' +
      '    {\n' +
      '      "type": "Page",\n' +
      '      "props": {\n' +
      '        "size": "A4",\n' +
      '        "orientation": "portrait"\n' +
      '      },\n' +
      '      "children": [\n' +
      '        {\n' +
      '          "type": "Text",\n' +
      '          "props": {\n' +
      '            "children": "Content",\n' +
      '            "style": {\n' +
      '              "fontSize": 16\n' +
      '            }\n' +
      '          }\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'Generate the ' + pdfType + ' JSON now:';
    
    return this.generatePdfJson(prompt);
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say "Hello"' }],
        max_tokens: 10,
      });
      
      const content = response.choices[0]?.message?.content;
      console.log('Deepseek test:', content);
      return !!content;
      
    } catch (error: any) {
      console.error('Deepseek test failed:', error.message);
      return false;
    }
  }
}