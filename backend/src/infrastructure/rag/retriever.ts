import { type Kysely, sql } from 'kysely';
import type { Database } from '../../db/type/index.js';

export class Retriever {
  constructor(private readonly db: Kysely<Database>) {}

  async search(documentId: number, embedding: number[], limit = 5) {
    const distance = sql<number>`embedding <=> ${JSON.stringify(embedding)}::vector`;
    return this.db.selectFrom('document_chunks')
      .select(['id', 'chunk_index', 'content'])
      .select(sql<number>`1 - (${distance})`.as('similarity'))
      .where('document_id', '=', documentId)
      .where('embedding', 'is not', null)
      .orderBy(distance).orderBy('chunk_index').limit(limit).execute();
  }
}
