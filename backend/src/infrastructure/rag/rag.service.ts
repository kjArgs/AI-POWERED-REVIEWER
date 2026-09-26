import type { EmbeddingService } from '../embeddings/embedding.service.js';
import type { AIService } from '../ai/ai.service.js';
import type { Retriever } from './retriever.js';
import { chunkText } from './chunker.js';
import { AppError } from '../../shared/errors/app-error.js';

export class RagService {
  constructor(private readonly embeddings: EmbeddingService, private readonly retriever: Retriever, private readonly ai: AIService) {}

  async prepareChunks(text: string) {
    const chunks = chunkText(text);
    const result = [];
    // Bound concurrency and preserve original chunk order.
    for (let start = 0; start < chunks.length; start += 3) {
      result.push(...await Promise.all(chunks.slice(start, start + 3).map(async chunk => ({
        ...chunk, embedding: await this.embeddings.generateEmbedding(chunk.content),
      }))));
    }
    return result;
  }

  async answerQuestion(documentId: number, question: string) {
    const embedding = await this.embeddings.generateEmbedding(question, 'RETRIEVAL_QUERY');
    const sources = await this.retriever.search(documentId, embedding);
    if (!sources.length) throw new AppError('Document has no indexed chunks; use basic chat or re-upload with RAG enabled', 409);
    const context = sources.map(s => `[Chunk ${s.chunk_index + 1}]\n${s.content}`).join('\n\n');
    return { documentId, answer: await this.ai.answerQuestion(question, context), sources };
  }
}
