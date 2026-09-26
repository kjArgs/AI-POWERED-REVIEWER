import type { Generated } from 'kysely';

export interface Database {
  documents: {
    id: Generated<number>;
    filename: string;
    title: string | null;
    extracted_text: string | null;
    created_at: string | null;
  };
  document_chunks: {
    id: Generated<number>;
    document_id: number;
    chunk_index: number;
    content: string;
    embedding: string | null;
    created_at: string | null;
  };
  summaries: {
    id: Generated<number>;
    document_id: number;
    content: string;
    created_at: string | null;
  };
}
