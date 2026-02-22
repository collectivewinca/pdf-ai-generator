// Example: Invoice generation
export const invoiceSpec = {
  type: 'Document',
  props: {
    title: 'Invoice #INV-2024-001',
    author: 'Acme Corp',
    subject: 'Consulting Services',
  },
  children: [
    {
      type: 'Page',
      props: { size: 'LETTER' },
      children: [
        {
          type: 'View',
          props: { style: { padding: 40 } },
          children: [
            {
              type: 'Text',
              props: {
                children: 'INVOICE',
                style: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Invoice #: INV-2024-001',
                style: { fontSize: 12, marginBottom: 5 }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Date: January 15, 2024',
                style: { fontSize: 12, marginBottom: 5 }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'Due Date: February 14, 2024',
                style: { fontSize: 12, marginBottom: 30 }
              }
            },
            // Line items table would go here
            {
              type: 'Text',
              props: {
                children: 'Total: $1,250.00',
                style: { fontSize: 16, fontWeight: 'bold', marginTop: 30 }
              }
            }
          ]
        }
      ]
    }
  ]
};

console.log('Invoice example spec created');
console.log('Pages:', invoiceSpec.children.length);
console.log('Title:', invoiceSpec.props?.title);
