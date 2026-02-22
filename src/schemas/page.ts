import { z } from 'zod';

export const PageSchema = z.object({
  type: z.literal('Page'),
  props: z.object({
    size: z.enum(['A4', 'LETTER', 'LEGAL', 'A3', 'A5']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    style: z.record(z.any()).optional(),
    margin: z.number().optional(),
  }).optional(),
  children: z.array(z.any()),
});

export type PageSpec = z.infer<typeof PageSchema>;
