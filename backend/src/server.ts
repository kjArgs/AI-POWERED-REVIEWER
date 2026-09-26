import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './db/index.js';
import { OllamaProvider } from './infrastructure/ai/ollama.provider.js';
import { OllamaEmbeddingProvider } from './infrastructure/embeddings/ollama.embedding.js';

const app = createApp({
  db,
  aiProvider: new OllamaProvider(
    env.OLLAMA_BASE_URL,
    env.OLLAMA_API_KEY,
    env.OLLAMA_MODEL,
  ),
  embeddingProvider: new OllamaEmbeddingProvider(
    env.OLLAMA_BASE_URL,
    env.OLLAMA_API_KEY,
    env.OLLAMA_EMBEDDING_MODEL,
  ),
  chatMode: env.CHAT_MODE,
  corsOrigin: env.CORS_ORIGIN,
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  maxDocumentChars: env.MAX_DOCUMENT_CHARS,
});
const server = app.listen(env.PORT, () =>
  console.log(`Server running on http://localhost:${env.PORT}`),
);
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 15000);
  deadline.unref();
  server.close(() => {
    void db
      .destroy()
      .then(() => {
        clearTimeout(deadline);
      })
      .catch(() => {
        process.exitCode = 1;
      });
  });
  server.closeIdleConnections();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('error', () => {
  console.error('HTTP server could not start; check PORT and permissions');
  void db.destroy().finally(() => {
    process.exitCode = 1;
  });
});
