import { z } from 'zod';

export const TextSchema = z.object({
  type: z.literal('Text'),
  props: z.object({
    children: z.string(),
    style: z.record(z.any()).optional(),
    fixed: z.boolean().optional(),
    render: z.function().optional(),
  }),
});

export type TextSpec = z.infer<typeof TextSchema>;
