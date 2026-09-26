# AI Study Helper — Phase 1 & 2 MVP

Backend implementation and run instructions: [backend/README.md](backend/README.md).
React frontend and run instructions: [frontend/README.md](frontend/README.md).

## 1. MVP Goal

Build an AI-powered study helper that allows students to:

1. Upload a PDF
2. Extract its text
3. Generate a summary using Gemini
4. Generate study questions using Gemini
5. Create embeddings from the PDF content
6. Store embeddings in PostgreSQL with `pgvector`
7. Ask questions about the PDF
8. Retrieve relevant PDF chunks using vector similarity
9. Give the retrieved context to Gemini
10. Generate an answer based on the document

The core RAG flow is:

```text
PDF
 ↓
Extract text
 ↓
Chunk text
 ↓
Generate embeddings
 ↓
PostgreSQL + pgvector
                    ↓
Student question
 ↓
Generate question embedding
 ↓
Vector similarity search
 ↓
Relevant chunks
 ↓
Gemini
 ↓
Answer
```

---

# 2. MVP Architecture

```text
┌──────────────────────────────┐
│          Frontend            │
│                              │
│  Upload PDF                  │
│  View Summary                │
│  Generate Questions          │
│  Ask Question                │
└──────────────┬───────────────┘
               │ HTTP
               ▼
┌──────────────────────────────┐
│       Express + TypeScript   │
│                              │
│  Document Module             │
│  Summary Module              │
│  Question Module             │
│  Chat Module                 │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐   ┌──────────────┐
│ PostgreSQL  │   │  Gemini API  │
│ + pgvector  │   │              │
└─────────────┘   └──────────────┘
       ▲
       │
       │ embeddings
       │
┌──────┴──────────────────────┐
│        RAG Pipeline         │
│                             │
│ Chunker → Embedding         │
│         → Retrieval         │
│         → Context           │
└─────────────────────────────┘
```

---

# 3. Technology Stack

## Backend

- Node.js
- TypeScript
- Express
- Kysely
- PostgreSQL

## AI

- Gemini API
- Gemini Embeddings

## RAG

- PostgreSQL
- `pgvector`
- Vector similarity search

## PDF

- PDF text extraction library

## Frontend

- React
- TypeScript

The frontend can be kept simple for the MVP.

---

# 4. Project Structure

```text
ai-study-helper/
│
├── backend/
│   ├── src/
│   │
│   │   ├── app.ts
│   │   ├── server.ts
│   │   │
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── database.ts
│   │   │
│   │   ├── modules/
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── document.controller.ts
│   │   │   │   ├── document.service.ts
│   │   │   │   ├── document.repository.ts
│   │   │   │   └── document.routes.ts
│   │   │   │
│   │   │   ├── summaries/
│   │   │   │   ├── summary.controller.ts
│   │   │   │   ├── summary.service.ts
│   │   │   │   └── summary.routes.ts
│   │   │   │
│   │   │   ├── questions/
│   │   │   │   ├── question.controller.ts
│   │   │   │   ├── question.service.ts
│   │   │   │   └── question.routes.ts
│   │   │   │
│   │   │   └── chat/
│   │   │       ├── chat.controller.ts
│   │   │       ├── chat.service.ts
│   │   │       └── chat.routes.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── ai.provider.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   ├── gemini.provider.ts
│   │   │   │   └── prompts/
│   │   │   │       ├── summary.prompt.ts
│   │   │   │       ├── question.prompt.ts
│   │   │   │       └── chat.prompt.ts
│   │   │   │
│   │   │   ├── pdf/
│   │   │   │   ├── pdf-extractor.ts
│   │   │   │   └── pdf.service.ts
│   │   │   │
│   │   │   ├── embeddings/
│   │   │   │   ├── embedding.provider.ts
│   │   │   │   ├── embedding.service.ts
│   │   │   │   └── gemini.embedding.ts
│   │   │   │
│   │   │   └── rag/
│   │   │       ├── chunker.ts
│   │   │       ├── retriever.ts
│   │   │       └── rag.service.ts
│   │   │
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── types.ts
│   │   │
│   │   └── middleware/
│   │       ├── error.middleware.ts
│   │       └── upload.middleware.ts
│   │
│   └── package.json
│
├── frontend/
│   └── ...
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── rag.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 5. Phase 1 — Express + Gemini API

## Goal

Build the actual study helper before introducing RAG.

The Phase 1 pipeline is:

```text
PDF
 ↓
Extract text
 ↓
Gemini API
 ├── Summary
 ├── Questions
 └── Basic Chat
```

---

## Phase 1 Features

### 5.1 Upload PDF

The student uploads a PDF.

```http
POST /api/documents
```

Request:

```text
multipart/form-data

file: textbook.pdf
```

Flow:

```text
Upload PDF
    ↓
Validate PDF
    ↓
Extract text
    ↓
Save document
```

---

## 5.2 Generate Summary

```http
POST /api/documents/:id/summary
```

Flow:

```text
Document ID
     ↓
Get extracted text
     ↓
Gemini API
     ↓
Summary
     ↓
Save summary
     ↓
Return summary
```

Example response:

```json
{
  "documentId": 1,
  "summary": "Photosynthesis is the process..."
}
```

---

## 5.3 Generate Questions

```http
POST /api/documents/:id/questions
```

Flow:

```text
Document
   ↓
Extracted text
   ↓
Gemini
   ↓
5 Questions
```

Example:

```json
{
  "questions": [
    {
      "question": "What is photosynthesis?",
      "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B"
    }
  ]
}
```

For the MVP, generate approximately 5 questions.

---

## 5.4 Basic Chat

Phase 1 can support basic document chat without vector retrieval.

```http
POST /api/documents/:id/chat
```

Request:

```json
{
  "question": "What is photosynthesis?"
}
```

The service sends the document text and question to Gemini.

```text
Question
   +
Document text
   ↓
Gemini
   ↓
Answer
```

This works for small documents but becomes inefficient for large PDFs.

That limitation motivates Phase 2.

---

# 6. AI Provider Abstraction

Do not make every service directly dependent on Gemini.

Create an interface:

```typescript
export interface AIProvider {
  summarize(text: string): Promise<string>;

  generateQuestions(text: string): Promise<Question[]>;

  answerQuestion(question: string, context: string): Promise<string>;
}
```

Then:

```text
AIProvider
     ↑
     │
GeminiProvider
```

The application uses:

```text
AIService
    ↓
AIProvider
    ↓
GeminiProvider
    ↓
Gemini API
```

This allows another provider to be added later without rewriting the application layer.

---

# 7. Phase 1 PDF Processing

Create:

```text
infrastructure/
└── pdf/
    ├── pdf-extractor.ts
    └── pdf.service.ts
```

Responsibilities:

### `pdf-extractor.ts`

Responsible for:

```text
PDF
 ↓
Extracted text
```

It knows **how** PDF extraction works.

### `pdf.service.ts`

Responsible for:

```text
Uploaded PDF
 ↓
Validate
 ↓
Extract
 ↓
Prepare document
```

It knows **what the application needs to do** with the PDF.

---

# 8. Phase 2 — PostgreSQL + pgvector + RAG

## Goal

Make the Study Helper capable of retrieving relevant information from large PDFs.

The pipeline becomes:

```text
PDF
 ↓
Extract text
 ↓
Chunk text
 ↓
Generate embeddings
 ↓
PostgreSQL + pgvector
```

Then:

```text
Student question
 ↓
Question embedding
 ↓
Vector similarity search
 ↓
Relevant PDF chunks
 ↓
Gemini
 ↓
Answer
```

---

# 9. Phase 2 Database

Enable the `pgvector` extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 9.1 Documents Table

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,

    filename VARCHAR(255) NOT NULL,

    title VARCHAR(255),

    extracted_text TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9.2 Document Chunks

```sql
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,

    document_id INTEGER NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,

    content TEXT NOT NULL,

    embedding VECTOR(768),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

> `768` is an example. The vector dimension must match the embedding model being used.

---

## 9.3 Summaries

```sql
CREATE TABLE summaries (
    id SERIAL PRIMARY KEY,

    document_id INTEGER NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

# 10. Phase 2 PDF Pipeline

When a PDF is uploaded:

```text
PDF
 ↓
PDF Extractor
 ↓
Plain Text
 ↓
Chunker
 ↓
Chunk 1
Chunk 2
Chunk 3
Chunk 4
...
 ↓
Embedding Service
 ↓
Embedding 1
Embedding 2
Embedding 3
Embedding 4
...
 ↓
PostgreSQL + pgvector
```

For example:

```text
PDF
│
├── Chunk 1
│   "Photosynthesis is the process..."
│
├── Chunk 2
│   "Chloroplasts contain chlorophyll..."
│
├── Chunk 3
│   "The light-dependent reactions..."
│
└── Chunk 4
    "The Calvin cycle..."
```

Each chunk stores:

```text
document_id
chunk_index
content
embedding
```

---

# 11. Embeddings

Create:

```text
infrastructure/
└── embeddings/
    ├── embedding.provider.ts
    ├── embedding.service.ts
    └── gemini.embedding.ts
```

Interface:

```typescript
export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
}
```

Architecture:

```text
EmbeddingProvider
       ↑
       │
GeminiEmbeddingProvider
```

The application uses:

```typescript
embeddingService.generateEmbedding(text);
```

rather than calling the embedding API directly throughout the application.

---

# 12. Why Embed Chunks Instead of the Entire PDF?

Do not normally create one embedding for a 100-page PDF.

Instead:

```text
100-page PDF
     ↓
Extract text
     ↓
Split into chunks
     ↓
Embed each chunk
```

Example:

```text
PDF
 ↓
500 chunks
 ↓
500 embeddings
```

This allows the system to retrieve only the relevant sections.

For example:

```text
Student:

"What is the function of mitochondria?"
```

Instead of sending all 100 pages to Gemini:

```text
100 pages
 ↓
Gemini
```

The system does:

```text
Question
 ↓
Embedding
 ↓
Vector search
 ↓
Top 5 relevant chunks
 ↓
Gemini
```

---

# 13. Chunker

Create:

```text
infrastructure/rag/chunker.ts
```

The MVP chunking strategy can be simple:

```text
Extracted text
 ↓
Split into approximately
500–1000 token chunks
 ↓
Small overlap
```

Example:

```text
Chunk 1
"Photosynthesis is..."

Chunk 2
"Plants contain chlorophyll..."

Chunk 3
"During the light reactions..."

Chunk 4
"The Calvin cycle..."
```

Later, chunking can be improved using:

- headings
- paragraphs
- sections
- token count
- overlap
- semantic boundaries

---

# 14. Retriever

Create:

```text
infrastructure/rag/retriever.ts
```

Its responsibility is to find the most relevant chunks.

Conceptually:

```typescript
const chunks = await retriever.search({
  documentId,
  embedding,
  limit: 5,
});
```

The database performs a vector similarity search.

Conceptually:

```sql
SELECT
    id,
    content
FROM document_chunks
WHERE document_id = ?
ORDER BY embedding <=> ?
LIMIT 5;
```

The exact similarity operator depends on the metric being used.

---

# 15. RAG Service

Create:

```text
infrastructure/rag/rag.service.ts
```

The RAG service orchestrates the entire retrieval process.

```typescript
export class RagService {
  async answerQuestion(documentId: number, question: string) {
    // 1. Create question embedding
    // 2. Search similar chunks
    // 3. Build context
    // 4. Send context + question to Gemini
    // 5. Return answer
  }
}
```

Architecture:

```text
RagService
│
├── EmbeddingService
│
├── Retriever
│
└── AIService
```

---

# 16. RAG Chat Flow

Request:

```http
POST /api/documents/:id/chat
```

Body:

```json
{
  "question": "What is the main function of mitochondria?"
}
```

Internally:

```text
Student question
       ↓
Embedding model
       ↓
Question vector
       ↓
PostgreSQL + pgvector
       ↓
Top 5 relevant chunks
       ↓
Build context
       ↓
Gemini
       ↓
Answer
```

---

# 17. RAG Prompt

Gemini should receive the retrieved document content as context.

Conceptually:

```text
You are an AI study assistant.

Answer the student's question using the provided
document context.

If the answer cannot be found in the provided context,
say that the information is not available in the document.

Context:

[Chunk 17]
Mitochondria are organelles responsible...

[Chunk 23]
ATP is produced through...

Question:

What is the main function of mitochondria?
```

This helps keep the answer grounded in the uploaded document.

---

# 18. MVP API Routes

Keep the API small.

## Documents

```http
POST   /api/documents
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
```

## Summary

```http
POST /api/documents/:id/summary
```

## Questions

```http
POST /api/documents/:id/questions
```

## RAG Chat

```http
POST /api/documents/:id/chat
```

That's enough for the MVP.

---

# 19. Complete MVP Flow

## Upload

```text
POST /api/documents
        │
        ▼
   PDF Extractor
        │
        ▼
   Extracted Text
        │
        ├───────────────┐
        ▼               ▼
   PostgreSQL        Chunker
                        │
                        ▼
                   Embeddings
                        │
                        ▼
                    pgvector
```

## Summary

```text
POST /api/documents/1/summary
              ↓
       Get document text
              ↓
           Gemini
              ↓
           Summary
```

## Questions

```text
POST /api/documents/1/questions
              ↓
       Get document text
              ↓
           Gemini
              ↓
        5 Questions
```

## RAG Chat

```text
POST /api/documents/1/chat

"What is photosynthesis?"
              ↓
      Question embedding
              ↓
       pgvector search
              ↓
       Relevant chunks
              ↓
      Construct context
              ↓
            Gemini
              ↓
           Answer
```

---

# 20. Development Roadmap

Implement the MVP in this order.

## Step 1 — Backend Setup

```text
Express
TypeScript
Kysely
PostgreSQL
```

Goal:

```text
GET /health
```

returns:

```json
{
  "status": "ok"
}
```

---

## Step 2 — PDF Upload

Implement:

```text
POST /api/documents
```

Learn:

- multipart/form-data
- file validation
- PDF extraction
- service/repository separation

---

## Step 3 — Gemini Integration

Implement:

```text
AIProvider
AIService
GeminiProvider
```

Then:

```text
POST /api/documents/:id/summary
```

---

## Step 4 — Question Generation

Implement:

```text
POST /api/documents/:id/questions
```

Generate approximately five questions.

At this point:

# Phase 1 is complete.

You have:

```text
PDF
 ↓
Text
 ↓
Gemini
 ↓
Summary
Questions
```

---

# Step 5 — PostgreSQL

Create:

```text
documents
summaries
```

Then store document information in PostgreSQL.

---

# Step 6 — pgvector

Enable:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Create:

```text
document_chunks
```

with an embedding column.

---

# Step 7 — Chunking

Implement:

```text
chunker.ts
```

Pipeline:

```text
PDF text
 ↓
Chunks
```

---

# Step 8 — Embeddings

Implement:

```text
EmbeddingProvider
EmbeddingService
GeminiEmbeddingProvider
```

Pipeline:

```text
Chunk
 ↓
Embedding API
 ↓
Vector
```

Store the vector in PostgreSQL.

---

# Step 9 — Vector Retrieval

Implement:

```text
retriever.ts
```

Pipeline:

```text
Question
 ↓
Question embedding
 ↓
pgvector
 ↓
Top 5 chunks
```

---

# Step 10 — RAG

Implement:

```text
rag.service.ts
```

Pipeline:

```text
Question
 ↓
Embedding
 ↓
Retrieval
 ↓
Context
 ↓
Gemini
 ↓
Answer
```

At this point:

# Phase 2 is complete.

---

# 21. What Is NOT in the MVP?

Do not add these yet:

```text
❌ Authentication
❌ User profiles
❌ Multiple AI providers
❌ LoRA
❌ Qwen training
❌ Fine-tuning
❌ Model hosting
❌ Redis
❌ Microservices
❌ Kubernetes
❌ Advanced analytics
❌ Recommendation system
❌ AI agents
❌ Complex study tracking
```

These can be added after the core system works.

---

# 22. Final MVP Architecture

```text
                         FRONTEND
                            │
                            ▼
                     EXPRESS API
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     Documents          Summaries         Questions
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                     Application Layer
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        PostgreSQL                     AI Layer
              │                           │
              │                      Gemini API
              │
        ┌─────┴──────┐
        │            │
        ▼            ▼
   Documents     pgvector
                     │
                     ▼
              Vector Retrieval
                     │
                     ▼
                    RAG
                     │
                     ▼
                   Gemini
```

---

# 23. What You Learn From This MVP

By completing this project, you will understand:

### Backend

```text
Express
TypeScript
Layered Architecture
Controllers
Services
Repositories
PostgreSQL
Kysely
REST APIs
File Uploads
```

### LLM Integration

```text
LLM APIs
Prompt Engineering
AI Provider Abstraction
Context Management
Structured AI Responses
```

### Embeddings

```text
Text → Vector
Semantic Similarity
Vector Dimensions
Similarity Search
```

### RAG

```text
Documents
 ↓
Chunking
 ↓
Embeddings
 ↓
Vector Database
 ↓
Retrieval
 ↓
Context
 ↓
LLM
```

---

# 24. Mental Model

Keep these three concepts separate:

```text
LLM
"What should I generate?"
```

```text
Embeddings
"Where is the relevant information?"
```

```text
RAG
"Give the LLM the relevant information."
```

For this MVP:

```text
Gemini
    +
Embeddings
    +
PostgreSQL/pgvector
    +
RAG
```

is enough to build a useful document-based AI Study Helper **without training your own model**.

LoRA/fine-tuning can be treated as a later Phase 3 once the Phase 1 + 2 system is working.
