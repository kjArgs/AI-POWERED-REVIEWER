import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import { Kysely, PGliteDialect, sql } from 'kysely';
import { Migrator } from 'kysely/migration';
import type { Database } from '../src/db/type/index.js';
import { createApp } from '../src/app.js';
import type { AIProvider } from '../src/infrastructure/ai/ai.provider.js';
import { AppError } from '../src/shared/errors/app-error.js';
import { DocumentRepository } from '../src/modules/documents/document.repository.js';
import { studyPdf } from './fixtures.js';
import * as first from '../src/db/migrations/001-initial-migration.js';
import * as second from '../src/db/migrations/002-create-document-chunks-table.js';
import * as third from '../src/db/migrations/003-create-summaries-table.js';
import * as fourth from '../src/db/migrations/004-index-document-relations.js';

const db = new Kysely<Database>({
  dialect: new PGliteDialect({
    pglite: new PGlite({ extensions: { vector } }),
  }),
});
const aiCalls: string[] = [];
const aiProvider: AIProvider = {
  summarize: async (text) => {
    aiCalls.push(text);
    return 'Plants convert sunlight into chemical energy.';
  },
  generateQuestions: async (text) => {
    aiCalls.push(text);
    return {
      multiple_choice: Array.from({ length: 5 }, () => ({
        question: 'What powers photosynthesis?',
        choices: ['A. Sunlight', 'B. Sand', 'C. Metal', 'D. Rocks'],
        answer: 'A' as const,
      })),
      enumeration: Array.from({ length: 5 }, () => ({
        question: 'Enumerate a photosynthesis component.',
        answer: ['Sunlight'],
      })),
      explanation: Array.from({ length: 5 }, () => ({
        question: 'Explain photosynthesis.',
        answer: 'Plants use sunlight to make energy.',
      })),
    };
  },
  answerQuestion: async (_question, context) => {
    aiCalls.push(context);
    return 'Sunlight provides energy. [Chunk 1]';
  },
};
const embeddingTasks: string[] = [];
const embeddingProvider = {
  generateEmbedding: async (_text: string, task = '') => {
    embeddingTasks.push(task);
    return [1, ...Array(767).fill(0)];
  },
};
const app = createApp({ db, aiProvider, embeddingProvider });

before(async () => {
  const migrator = new Migrator({
    db,
    provider: {
      getMigrations: async () => ({
        '001': first,
        '002': second,
        '003': third,
        '004': fourth,
      }),
    },
  });
  const result = await migrator.migrateToLatest();
  assert.ifError(result.error);
  assert.equal(result.results?.length, 4);
  assert.equal((await migrator.migrateToLatest()).results?.length, 0);
});
after(async () => {
  await db.destroy();
});

test('full PDF upload, CRUD, summary, questions, scoped RAG chat and cascade deletion', async () => {
  await request(app).get('/health').expect(200, { status: 'ok' });
  await request(app).get('/health/ready').expect(200);
  const upload = await request(app)
    .post('/api/documents')
    .field('title', 'Biology')
    .attach('file', studyPdf(), 'study.pdf')
    .expect(201);
  const id = upload.body.id;
  assert.match(upload.body.extracted_text, /Photosynthesis/);
  assert.equal(upload.body.title, 'Biology');
  assert.equal(upload.headers.location, `/api/documents/${id}`);
  const second = await request(app)
    .post('/api/documents')
    .attach(
      'file',
      studyPdf('Unrelated document about geometry.'),
      'geometry.pdf',
    )
    .expect(201);
  const list = await request(app)
    .get('/api/documents?limit=1&offset=0')
    .expect(200);
  assert.equal(list.body.documents.length, 1);
  assert.equal(list.body.documents[0].extracted_text, undefined);
  await request(app).get(`/api/documents/${id}`).expect(200);
  const updated = await request(app)
    .patch(`/api/documents/${id}`)
    .send({ title: 'Plant biology' })
    .expect(200);
  assert.equal(updated.body.title, 'Plant biology');
  await request(app).get(`/api/documents/${id}/summary`).expect(404);
  const summary = await request(app)
    .post(`/api/documents/${id}/summary`)
    .expect(201);
  const saved = await request(app)
    .get(`/api/documents/${id}/summary`)
    .expect(200);
  assert.equal(summary.body.summary, saved.body.summary);
  const questions = await request(app)
    .post(`/api/documents/${id}/questions`)
    .expect(200);
  assert.equal(questions.body.questions.multiple_choice.length, 5);
  assert.equal(questions.body.questions.enumeration.length, 5);
  assert.equal(questions.body.questions.explanation.length, 5);
  const chat = await request(app)
    .post(`/api/documents/${id}/chat`)
    .send({ question: 'What powers photosynthesis?' })
    .expect(200);
  assert.equal(chat.body.mode, 'rag');
  assert.equal(chat.body.sources.length, 1);
  assert.match(chat.body.sources[0].content, /Photosynthesis/);
  assert.ok(!aiCalls.at(-1)!.includes('geometry'));
  assert.ok(embeddingTasks.includes('RETRIEVAL_QUERY'));
  await request(app).delete(`/api/documents/${id}`).expect(204);
  await request(app).get(`/api/documents/${id}`).expect(404);
  assert.equal(
    (
      await db
        .selectFrom('document_chunks')
        .selectAll()
        .where('document_id', '=', id)
        .execute()
    ).length,
    0,
  );
  assert.equal(
    (
      await db
        .selectFrom('summaries')
        .selectAll()
        .where('document_id', '=', id)
        .execute()
    ).length,
    0,
  );
  await request(app).delete(`/api/documents/${second.body.id}`).expect(204);
});

test('bad uploads, bodies, ids, pagination and missing documents return useful errors', async () => {
  await request(app).post('/api/documents').expect(400);
  await request(app)
    .post('/api/documents')
    .attach('file', Buffer.from('not a pdf'), 'bad.pdf')
    .expect(400);
  await request(app)
    .post('/api/documents')
    .attach('wrong', studyPdf(), 'study.pdf')
    .expect(400);
  await request(app).get('/api/documents/not-a-number').expect(400);
  await request(app).get('/api/documents?limit=0').expect(400);
  await request(app)
    .post('/api/documents/1/chat')
    .send({ question: ' ' })
    .expect(400);
  await request(app)
    .post('/api/documents/1/chat')
    .set('Content-Type', 'application/json')
    .send('{')
    .expect(400);
  await request(app)
    .post('/api/documents/1/chat')
    .send({ question: 'x'.repeat(40000) })
    .expect(413);
  await request(app).get('/missing').expect(404);
  for (const feature of ['summary', 'questions', 'chat']) {
    await request(app)
      .post(`/api/documents/999999/${feature}`)
      .send({ question: 'Hello?' })
      .expect(404);
  }
  const tiny = createApp({
    db,
    aiProvider,
    embeddingProvider,
    maxUploadBytes: 20,
  });
  await request(tiny)
    .post('/api/documents')
    .attach('file', studyPdf(), 'study.pdf')
    .expect(413);
});

test('basic mode does not need embeddings and RAG reports unindexed documents', async () => {
  const basic = createApp({
    db,
    aiProvider,
    chatMode: 'basic',
    embeddingProvider: {
      generateEmbedding: async () => {
        throw new Error('must not be called');
      },
    },
  });
  const upload = await request(basic)
    .post('/api/documents')
    .attach('file', studyPdf(), 'study.pdf')
    .expect(201);
  const id = upload.body.id;
  const chat = await request(basic)
    .post(`/api/documents/${id}/chat`)
    .send({ question: 'What is photosynthesis?' })
    .expect(200);
  assert.equal(chat.body.mode, 'basic');
  assert.deepEqual(chat.body.sources, []);
  await request(app)
    .post(`/api/documents/${id}/chat`)
    .send({ question: 'What is photosynthesis?' })
    .expect(409);
  await request(basic).delete(`/api/documents/${id}`).expect(204);
});

test('failed embeddings leave no documents and database transactions roll back failed chunk writes', async () => {
  const failing = createApp({
    db,
    aiProvider,
    embeddingProvider: {
      generateEmbedding: async () => {
        throw new AppError('Embedding service unavailable', 502);
      },
    },
  });
  const before = await db.selectFrom('documents').selectAll().execute();
  await request(failing)
    .post('/api/documents')
    .attach('file', studyPdf(), 'failed.pdf')
    .expect(502);
  assert.deepEqual(
    await db.selectFrom('documents').selectAll().execute(),
    before,
  );
  await assert.rejects(
    new DocumentRepository(db).create(
      { filename: 'rollback.pdf', title: null, extracted_text: 'text' },
      [{ chunk_index: 0, content: 'text', embedding: [1] }],
    ),
  );
  assert.deepEqual(
    await db.selectFrom('documents').selectAll().execute(),
    before,
  );
});

test('vector search ranks matches and only returns chunks from the requested document', async () => {
  const repository = new DocumentRepository(db);
  const vectorA = [1, ...Array(767).fill(0)];
  const vectorB = [0, 1, ...Array(766).fill(0)];
  const doc = await repository.create(
    { filename: 'rank.pdf', title: null, extracted_text: 'ranking' },
    [
      { chunk_index: 0, content: 'Less relevant', embedding: vectorB },
      { chunk_index: 1, content: 'Most relevant', embedding: vectorA },
    ],
  );
  const chat = await request(app)
    .post(`/api/documents/${doc.id}/chat`)
    .send({ question: 'Match?' })
    .expect(200);
  assert.equal(chat.body.sources[0].content, 'Most relevant');
  assert.equal(chat.body.sources[0].similarity, 1);
  assert.equal(chat.body.sources[1].similarity, 0);
  await repository.delete(doc.id);
});
