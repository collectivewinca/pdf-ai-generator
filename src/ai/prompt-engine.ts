import { pdfCatalog } from '../catalog/pdf-catalog';

export type DocumentType = 'invoice' | 'report' | 'contract' | 'presentation' | 'letter';

export function generatePdfPrompt(
  documentType: DocumentType,
  requirements: string,
  examples?: string[]
): string {
  const typeRules = {
    invoice: [
      'Include invoice number, date, due date',
      'List line items with description, quantity, unit price, total',
      'Calculate subtotal, tax, discount, grand total',
      'Include payment terms and company details',
    ],
    report: [
      'Include executive summary',
      'Use sections with headings',
      'Include data tables or charts',
      'Add conclusions and recommendations',
    ],
    contract: [
      'Include parties information',
      'Define terms and conditions',
      'Add signature blocks',
      'Include dates and effective periods',
    ],
    presentation: [
      'Use slide-like structure',
      'Include titles and bullet points',
      'Add speaker notes if needed',
      'Use visual hierarchy',
    ],
    letter: [
      'Include date, recipient, sender',
      'Use proper salutation and closing',
      'Organize content in paragraphs',
      'Add signature block',
    ],
  };

  const rules = typeRules[documentType] || [];

  const exampleText = examples?.length
    ? `\n\nEXAMPLES:\n${examples.map((ex, i) => `Example ${i + 1}:\n${ex}`).join('\n\n')}`
    : '';

  return `Generate a ${documentType} PDF document.

REQUIREMENTS:
${requirements}

DOCUMENT RULES:
${rules.map(rule => `- ${rule}`).join('\n')}

COMPONENT CATALOG:
- Document: Root container (optional: title, author, subject)
- Page: PDF page (size: A4|LETTER|LEGAL, orientation: portrait|landscape)
- Text: Text content with styling
- View: Layout container (like div)

OUTPUT FORMAT:
Return ONLY valid JSON matching the component schemas.
Include proper styling for readability.
Use appropriate margins and spacing.

${exampleText}

Generate the ${documentType} JSON spec now:`;
}

export function getValidationPrompt(errors: string[]): string {
  return `The generated PDF spec has validation errors:

${errors.map(error => `- ${error}`).join('\n')}

Please fix the JSON spec to resolve these validation errors.
Return ONLY the corrected JSON spec.`;
}
