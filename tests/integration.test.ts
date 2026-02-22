import { describe, it, expect } from 'vitest';
import { DocumentSchema } from '../src/schemas/document';
import { PageSchema } from '../src/schemas/page';
import { TextSchema } from '../src/schemas/text';
import { generatePdfPrompt } from '../src/ai/prompt-engine';

describe('PDF AI Generator Integration', () => {
  it('validates basic document structure', () => {
    const spec = {
      type: 'Document',
      props: { title: 'Test Document' },
      children: [
        {
          type: 'Page',
          props: { size: 'A4' },
          children: [
            {
              type: 'Text',
              props: { children: 'Hello, World!' }
            }
          ]
        }
      ]
    };

    expect(() => DocumentSchema.parse(spec)).not.toThrow();
    expect(() => PageSchema.parse(spec.children[0])).not.toThrow();
    expect(() => TextSchema.parse(spec.children[0].children[0])).not.toThrow();
  });

  it('generates invoice prompt', () => {
    const prompt = generatePdfPrompt('invoice', 'Create invoice for 3 consulting hours at /hour');
    
    expect(prompt).toContain('Generate a invoice PDF document');
    expect(prompt).toContain('invoice number');
    expect(prompt).toContain('line items');
  });

  it('rejects invalid document type', () => {
    const invalidSpec = {
      type: 'InvalidType',
      children: []
    };

    expect(() => DocumentSchema.parse(invalidSpec)).toThrow();
  });
});
