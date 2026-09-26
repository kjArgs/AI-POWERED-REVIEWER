import { GoogleGenAI } from '@google/genai';
import type { EmbeddingProvider, EmbeddingTask } from './embedding.provider.js';
import { EMBEDDING_DIMENSIONS } from './embedding.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly client: GoogleGenAI, private readonly model: string) {}

  async generateEmbedding(text: string, task: EmbeddingTask = 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
    try {
      // Embedding 2 uses task instructions in content instead of taskType.
      const contents = this.model === 'gemini-embedding-2'
        ? (task === 'RETRIEVAL_QUERY' ? `task: question answering | query: ${text}` : `title: none | text: ${text}`)
        : text;
      const response = await this.client.models.embedContent({
        model: this.model, contents,
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          ...(this.model === 'gemini-embedding-001' ? { taskType: task } : {}),
        },
      });
      return response.embeddings?.[0]?.values ?? [];
    } catch { throw new AppError('Embedding service unavailable; please try again later', 502); }
  }
}
