import { z } from 'zod';

export const DocumentSchema = z.object({
  type: z.literal('Document'),
  props: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    subject: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  children: z.array(z.any()),
});

export type DocumentSpec = z.infer<typeof DocumentSchema>;
