import type { EmbeddingProvider, EmbeddingTask } from './embedding.provider.js';
import { EMBEDDING_DIMENSIONS } from './embedding.service.js';
import { AppError } from '../../shared/errors/app-error.js';

type OllamaEmbeddingResponse = { embeddings?: number[][] };

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateEmbedding(
    text: string,
    task: EmbeddingTask = 'RETRIEVAL_DOCUMENT',
  ): Promise<number[]> {
    const input =
      task === 'RETRIEVAL_QUERY' ? `query: ${text}` : `document: ${text}`;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/embed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: this.model, input }),
      });
    } catch {
      throw new AppError(
        'Ollama embedding service unavailable; please try again later',
        502,
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | OllamaEmbeddingResponse
      | { error?: string }
      | null;
    if (!response.ok) {
      const error =
        payload && 'error' in payload && payload.error
          ? payload.error
          : 'Ollama embedding request failed';
      if (response.status === 429)
        throw new AppError(
          'AI rate limit reached; please try again later',
          429,
        );
      throw new AppError(error, response.status >= 500 ? 502 : response.status);
    }
    const embedding =
      payload && 'embeddings' in payload ? payload.embeddings?.[0] : undefined;
    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new AppError('Embedding service returned an invalid vector', 502);
    }
    return embedding;
  }
}
