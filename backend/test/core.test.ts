import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText } from '../src/infrastructure/rag/chunker.js';
import { EmbeddingService } from '../src/infrastructure/embeddings/embedding.service.js';
import { GeminiProvider, parseQuestions } from '../src/infrastructure/ai/gemini.provider.js';
import { GeminiEmbeddingProvider } from '../src/infrastructure/embeddings/gemini.embedding.js';
import { PdfExtractor } from '../src/infrastructure/pdf/pdf-extractor.js';
import { PdfService } from '../src/infrastructure/pdf/pdf.service.js';
import { studyPdf } from './fixtures.js';
import type { GoogleGenAI } from '@google/genai';

test('chunking preserves coverage, overlap, order and bounded sizes', () => {
  const text = '0123456789'.repeat(1001);
  const chunks = chunkText(text, 100, 20);
  assert.equal(chunks[0].content + chunks.slice(1).map(c => c.content.slice(20)).join(''), text);
  chunks.forEach((chunk, index) => { assert.equal(chunk.chunk_index, index); assert.ok(chunk.content.length <= 100); });
  assert.deepEqual(chunkText('   '), []);
  assert.throws(() => chunkText(text, 100, 100));
});

test('embeddings are normalized and invalid dimensions, non-finite and zero vectors rejected', async () => {
  const service = new EmbeddingService({ generateEmbedding: async () => Array(768).fill(2) });
  assert.ok(Math.abs(Math.hypot(...await service.generateEmbedding('text')) - 1) < 1e-10);
  for (const vector of [[], [1], Array(768).fill(0), Array(768).fill(NaN)]) {
    await assert.rejects(new EmbeddingService({ generateEmbedding: async () => vector }).generateEmbedding('text'), /invalid vector/);
  }
});

test('question output requires five complete multiple-choice questions', () => {
  const question = { question: 'What provides energy?', choices: ['A. Sunlight', 'B. Rocks', 'C. Sand', 'D. Metal'], answer: 'A' };
  assert.equal(parseQuestions(JSON.stringify(Array(5).fill(question))).length, 5);
  for (const text of ['not json', '[]', JSON.stringify(Array(5).fill({ ...question, answer: 'Z' }))]) {
    assert.throws(() => parseQuestions(text), /invalid study questions/);
  }
});

test('real PDF extraction and invalid/empty/oversized documents', async () => {
  assert.match(await new PdfExtractor().extract(studyPdf()), /Photosynthesis/);
  const file = { originalname: 'study.pdf', buffer: studyPdf() } as Express.Multer.File;
  await assert.rejects(new PdfService(new PdfExtractor()).prepare(undefined), /required/);
  await assert.rejects(new PdfService(new PdfExtractor()).prepare({ ...file, buffer: Buffer.from('fake') }), /valid PDF/);
  await assert.rejects(new PdfService({ extract: async () => '' }).prepare(file), /no extractable text/);
  await assert.rejects(new PdfService({ extract: async () => 'abcdef' }, 5).prepare(file), /character text limit/);
  await assert.rejects(new PdfService(new PdfExtractor()).prepare({ ...file, buffer: Buffer.from('%PDF-corrupt') }), /could not be read/);
});

test('Gemini adapter rejects empty, blocked, truncated and failed responses', async () => {
  for (const response of [{}, { text: 'partial', candidates: [{ finishReason: 'MAX_TOKENS' }] }]) {
    const client = { models: { generateContent: async () => response } } as unknown as GoogleGenAI;
    await assert.rejects(new GeminiProvider(client, 'test').summarize('text'), /complete response/);
  }
  const client = { models: { generateContent: async () => { throw new Error('secret upstream details'); } } } as unknown as GoogleGenAI;
  await assert.rejects(new GeminiProvider(client, 'test').summarize('text'), /AI service unavailable/);
});

test('Gemini embedding adapters use the matching model task format and 768 dimensions', async () => {
  const calls: any[] = [];
  const client = { models: { embedContent: async (args: unknown) => { calls.push(args); return { embeddings: [{ values: [1] }] }; } } } as unknown as GoogleGenAI;
  await new GeminiEmbeddingProvider(client, 'gemini-embedding-001').generateEmbedding('question', 'RETRIEVAL_QUERY');
  await new GeminiEmbeddingProvider(client, 'gemini-embedding-2').generateEmbedding('question', 'RETRIEVAL_QUERY');
  await new GeminiEmbeddingProvider(client, 'gemini-embedding-2').generateEmbedding('passage');
  assert.equal(calls[0].config.taskType, 'RETRIEVAL_QUERY');
  assert.equal(calls[1].contents, 'task: question answering | query: question');
  assert.equal(calls[1].config.taskType, undefined);
  assert.equal(calls[2].contents, 'title: none | text: passage');
  calls.forEach(call => assert.equal(call.config.outputDimensionality, 768));
});
