import { type Kysely, sql } from 'kysely';
import type { Database } from '../../db/type/index.js';

export interface NewDocument { filename: string; title: string | null; extracted_text: string }
export interface IndexedChunk { chunk_index: number; content: string; embedding: number[] }

export class DocumentRepository {
  constructor(private readonly db: Kysely<Database>) {}

  create(document: NewDocument, chunks: IndexedChunk[]) {
    return this.db.transaction().execute(async trx => {
      const saved = await trx.insertInto('documents').values(document).returningAll().executeTakeFirstOrThrow();
      if (chunks.length) {
        await trx.insertInto('document_chunks').values(chunks.map(chunk => ({
          document_id: saved.id,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          embedding: sql<string>`${JSON.stringify(chunk.embedding)}::vector`,
        }))).execute();
      }
      return saved;
    });
  }

  find(id: number) { return this.db.selectFrom('documents').selectAll().where('id', '=', id).executeTakeFirst(); }

  list(limit: number, offset: number) {
    return this.db.selectFrom('documents').select(['id', 'filename', 'title', 'created_at'])
      .orderBy('created_at', 'desc').orderBy('id', 'desc').limit(limit).offset(offset).execute();
  }

  updateTitle(id: number, title: string) {
    return this.db.updateTable('documents').set({ title }).where('id', '=', id).returningAll().executeTakeFirst();
  }

  delete(id: number) { return this.db.deleteFrom('documents').where('id', '=', id).returning('id').executeTakeFirst(); }

  saveSummary(documentId: number, content: string) {
    // INSERT ... SELECT avoids a foreign-key error when deletion wins the race.
    return this.db.insertInto('summaries').columns(['document_id', 'content'])
      .expression(eb => eb.selectFrom('documents').select(['id', sql<string>`${content}`.as('content')]).where('id', '=', documentId))
      .returningAll().executeTakeFirst();
  }

  latestSummary(documentId: number) {
    return this.db.selectFrom('summaries').selectAll().where('document_id', '=', documentId)
      .orderBy('created_at', 'desc').orderBy('id', 'desc').executeTakeFirst();
  }
}
