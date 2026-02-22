import OpenAI from 'openai';

export class DeepseekAI {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }
  
  async generatePdfJson(prompt: string): Promise<any> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a PDF document generator. Return ONLY valid JSON matching the specified schema. Do not include any explanations, markdown, or code blocks.'
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
      
      return JSON.parse(content);
      
    } catch (error: any) {
      console.error('Deepseek API error:', error.message);
      throw new Error('AI generation failed: ' + error.message);
    }
  }
  
  async generatePdfFromDescription(pdfType: string, description: string): Promise<any> {
    const prompt = 'Generate a ' + pdfType + ' PDF document JSON specification.\n\n' +
      'REQUIREMENTS:\n' + description + '\n\n' +
      'DOCUMENT STRUCTURE:\n' +
      '- Document: Root container with title, author, subject\n' +
      '- Page: PDF pages with size (A4, LETTER, LEGAL) and orientation\n' +
      '- Text: Text content with styling (fontSize, fontWeight, color, etc.)\n' +
      '- View: Layout containers for grouping\n\n' +
      'STYLING GUIDELINES:\n' +
      '- Use appropriate font sizes (24-48 for titles, 12-18 for body)\n' +
      '- Include margins and padding for readability\n' +
      '- Use consistent colors and spacing\n' +
      '- Make it professional and clean\n\n' +
      'OUTPUT FORMAT:\n' +
      'Return ONLY valid JSON matching this structure:\n' +
      '{\n' +
      '  type: Document,\n' +
      '  props: {\n' +
      '    title: Document Title,\n' +
      '    author: Author Name,\n' +
      '    subject: Document Subject\n' +
      '  },\n' +
      '  children: [\n' +
      '    {\n' +
      '      type: Page,\n' +
      '      props: {\n' +
      '        size: A4,\n' +
      '        orientation: portrait\n' +
      '      },\n' +
      '      children: [\n' +
      '        {\n' +
      '          type: Text,\n' +
      '          props: {\n' +
      '            children: Content here,\n' +
      '            style: {\n' +
      '              fontSize: 16,\n' +
      '              fontWeight: normal\n' +
      '            }\n' +
      '          }\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'Generate the ' + pdfType + ' JSON spec now:';
    
    return this.generatePdfJson(prompt);
  }
}
