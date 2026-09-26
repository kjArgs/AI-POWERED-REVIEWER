import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE UNIQUE INDEX document_chunks_order_idx ON document_chunks(document_id, chunk_index)`.execute(db);
  await sql`CREATE INDEX summaries_document_idx ON summaries(document_id, created_at DESC, id DESC)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS summaries_document_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS document_chunks_order_idx`.execute(db);
}
