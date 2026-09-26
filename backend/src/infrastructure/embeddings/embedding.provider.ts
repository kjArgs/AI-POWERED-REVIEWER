export type EmbeddingTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';
export interface EmbeddingProvider {
  generateEmbedding(text: string, task?: EmbeddingTask): Promise<number[]>;
}
