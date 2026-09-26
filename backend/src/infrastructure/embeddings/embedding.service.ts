import type { EmbeddingProvider, EmbeddingTask } from './embedding.provider.js';
import { AppError } from '../../shared/errors/app-error.js';

// This must match the vector column in migration 002.
export const EMBEDDING_DIMENSIONS = 768;

export class EmbeddingService {
  constructor(private readonly provider: EmbeddingProvider) {}

  async generateEmbedding(text: string, task: EmbeddingTask = 'RETRIEVAL_DOCUMENT') {
    const vector = await this.provider.generateEmbedding(text, task);
    if (vector.length !== EMBEDDING_DIMENSIONS || !vector.every(Number.isFinite)) {
      throw new AppError('Embedding service returned an invalid vector', 502);
    }
    const norm = Math.hypot(...vector);
    if (!Number.isFinite(norm) || norm === 0) throw new AppError('Embedding service returned an invalid vector', 502);
    return vector.map(value => value / norm);
  }
}
