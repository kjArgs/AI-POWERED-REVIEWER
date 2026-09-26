import { z } from 'zod';

export const documentId = z.coerce.number().int().positive().max(2147483647);
export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(2147483647).default(0),
}).strict();
export const titleBody = z.object({ title: z.string().trim().min(1).max(255).optional() }).strict();
export const chatBody = z.object({ question: z.string().trim().min(1).max(4000) }).strict();
