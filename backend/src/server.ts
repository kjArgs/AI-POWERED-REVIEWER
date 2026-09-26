import { GoogleGenAI } from '@google/genai';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './db/index.js';
import { GeminiProvider } from './infrastructure/ai/gemini.provider.js';
import { GeminiEmbeddingProvider } from './infrastructure/embeddings/gemini.embedding.js';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { timeout: 60000 } });
const app = createApp({
  db,
  aiProvider: new GeminiProvider(client, env.GEMINI_MODEL),
  embeddingProvider: new GeminiEmbeddingProvider(client, env.GEMINI_EMBEDDING_MODEL),
  chatMode: env.CHAT_MODE,
  corsOrigin: env.CORS_ORIGIN,
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  maxDocumentChars: env.MAX_DOCUMENT_CHARS,
});
const server = app.listen(env.PORT, () => console.log(`Server running on http://localhost:${env.PORT}`));
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 15000);
  deadline.unref();
  server.close(() => {
    void db.destroy().then(() => { clearTimeout(deadline); }).catch(() => { process.exitCode = 1; });
  });
  server.closeIdleConnections();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('error', () => {
  console.error('HTTP server could not start; check PORT and permissions');
  void db.destroy().finally(() => { process.exitCode = 1; });
});
