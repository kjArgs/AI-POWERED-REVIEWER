import type { Generated } from 'kysely';

export interface Database {
  documents: {
    id: Generated<number>;
    filename: string;
    title: string | null;
    extracted_text: string | null;
    created_at: Generated<Date>;
  };
  document_chunks: {
    id: Generated<number>;
    document_id: number;
    chunk_index: number;
    content: string;
    embedding: string | null;
    created_at: Generated<Date>;
  };
  summaries: {
    id: Generated<number>;
    document_id: number;
    content: string;
    created_at: Generated<Date>;
  };
}
