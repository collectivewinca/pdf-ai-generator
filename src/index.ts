import { pdfCatalog } from './catalog/pdf-catalog';
import { renderPdfFromSpec } from './renderer/pdf-renderer';
import { generatePdfPrompt } from './ai/prompt-engine';
import { DocumentSchema } from './schemas/document';

console.log('=== PDF AI Generator ===');
console.log('Version: 1.0.0');
console.log('Components:', pdfCatalog.componentNames);
console.log('Actions:', pdfCatalog.actionNames);
console.log('');

// Example usage
const examplePrompt = generatePdfPrompt('invoice', 
  'Create invoice for 3 items: Website Design (5h @ $150/h), Hosting ($50), Domain ($15)');

console.log('Example AI Prompt:');
console.log(examplePrompt.substring(0, 500) + '...');
console.log('');

// Example spec
const exampleSpec = {
  type: 'Document',
  props: { title: 'Example Invoice' },
  children: [
    {
      type: 'Page',
      props: { size: 'A4' },
      children: [
        {
          type: 'Text',
          props: { 
            children: 'PDF AI Generator - Ready!',
            style: { fontSize: 20, fontWeight: 'bold' }
          }
        }
      ]
    }
  ]
};

console.log('Example Spec Validation:');
try {
  DocumentSchema.parse(exampleSpec);
  console.log('✅ Spec is valid');
} catch (error) {
  console.log('❌ Validation error:', error);
}

console.log('');
console.log('Ready to generate PDFs with AI!');
console.log('Run: npm run example:invoice');
console.log('Or: npm run example:report');
