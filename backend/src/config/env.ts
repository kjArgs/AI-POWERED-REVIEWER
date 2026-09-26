import 'dotenv/config';
import { z } from 'zod';

// Define validation schema for environment variables
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  OLLAMA_API_KEY: z.string().min(1),
  OLLAMA_BASE_URL: z.string().url().default('https://ollama.com/api'),
  OLLAMA_MODEL: z.string().min(1).default('gemma4:31b'),
  OLLAMA_EMBEDDING_MODEL: z.string().min(1).default('embeddinggemma'),
  CHAT_MODE: z.enum(['rag', 'basic']).default('rag'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(50).default(10),
  MAX_DOCUMENT_CHARS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(1000000)
    .default(200000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Parse and validate environment variables
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
  );
}
export const env = parsed.data;

export type Env = z.infer<typeof EnvSchema>;
