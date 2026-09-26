import express from 'express';
import cors from 'cors';
import { sql, type Kysely } from 'kysely';
import type { Database } from './db/type/index.js';
import type { AIProvider } from './infrastructure/ai/ai.provider.js';
import type { EmbeddingProvider } from './infrastructure/embeddings/embedding.provider.js';
import { AIService } from './infrastructure/ai/ai.service.js';
import { EmbeddingService } from './infrastructure/embeddings/embedding.service.js';
import { PdfExtractor, type PDFExtractor } from './infrastructure/pdf/pdf-extractor.js';
import { PdfService } from './infrastructure/pdf/pdf.service.js';
import { Retriever } from './infrastructure/rag/retriever.js';
import { RagService } from './infrastructure/rag/rag.service.js';
import { DocumentRepository } from './modules/documents/document.repository.js';
import { DocumentService } from './modules/documents/document.service.js';
import { SummaryService } from './modules/summaries/summary.service.js';
import { QuestionService } from './modules/questions/question.service.js';
import { ChatService } from './modules/chat/chat.service.js';
import { documentRoutes } from './modules/documents/document.routes.js';
import { summaryRoutes } from './modules/summaries/summary.routes.js';
import { questionRoutes } from './modules/questions/question.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { asyncHandler, errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';

export interface AppDependencies {
  db: Kysely<Database>;
  aiProvider: AIProvider;
  embeddingProvider: EmbeddingProvider;
  pdfExtractor?: PDFExtractor;
  chatMode?: 'rag' | 'basic';
  corsOrigin?: string;
  maxUploadBytes?: number;
  maxDocumentChars?: number;
}

// Explicit dependencies allow tests to exercise real routes without live Gemini calls.
export function createApp(deps: AppDependencies): express.Application {
  const ai = new AIService(deps.aiProvider);
  const repository = new DocumentRepository(deps.db);
  const rag = deps.chatMode === 'basic' ? undefined : new RagService(
    new EmbeddingService(deps.embeddingProvider), new Retriever(deps.db), ai,
  );
  const documents = new DocumentService(repository, new PdfService(deps.pdfExtractor ?? new PdfExtractor(), deps.maxDocumentChars), rag);
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: deps.corsOrigin ?? 'http://localhost:5173' }));
  app.use(requestLoggerMiddleware);
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
  app.get('/health/ready', asyncHandler(async (_req, res) => {
    try {
      await sql`SELECT 1 FROM documents LIMIT 1`.execute(deps.db);
      await sql`SELECT 1 FROM document_chunks LIMIT 1`.execute(deps.db);
      await sql`SELECT 1 FROM summaries LIMIT 1`.execute(deps.db);
      res.json({ status: 'ok', database: 'ready' });
    } catch { res.status(503).json({ status: 'unavailable', database: 'not ready' }); }
  }));
  app.use('/api/documents', documentRoutes(documents, deps.maxUploadBytes ?? 10 * 1024 * 1024));
  app.use('/api/documents', summaryRoutes(new SummaryService(documents, repository, ai)));
  app.use('/api/documents', questionRoutes(new QuestionService(documents, ai)));
  app.use('/api/documents', chatRoutes(new ChatService(documents, ai, rag)));
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
