// Example: Report generation
export const reportSpec = {
  type: 'Document',
  props: {
    title: 'Q4 2023 Sales Report',
    author: 'Sales Department',
    subject: 'Quarterly Performance Analysis',
  },
  children: [
    {
      type: 'Page',
      props: { size: 'A4' },
      children: [
        {
          type: 'View',
          props: { style: { padding: 50 } },
          children: [
            {
              type: 'Text',
              props: {
                children: 'Q4 2023 SALES REPORT',
                style: { 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  marginBottom: 30 
                }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'EXECUTIVE SUMMARY',
                style: { 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  marginBottom: 15 
                }
              }
            },
            {
              type: 'Text',
              props: {
                children: 'This quarter showed 15% growth compared to Q3 2023...',
                style: { fontSize: 12, lineHeight: 1.5 }
              }
            }
          ]
        }
      ]
    }
  ]
};
