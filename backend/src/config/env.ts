import { z } from "zod";

// Define validation schema for environment variables
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  GEMINI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Parse and validate environment variables
export const env = EnvSchema.parse(process.env);

export type Env = z.infer<typeof EnvSchema>;
