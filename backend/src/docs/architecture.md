# AI Study Helper — Architecture

## 1. Architecture Style

The MVP uses a modular monolith with layered architecture.

The primary application flow is:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

AI-related operations use:

```text
Application Service
    ↓
AI Service
    ↓
AI Provider
    ↓
Gemini
```

RAG-related operations use:

```text
Chat Service
    ↓
RAG Service
    ├── Embedding Service
    ├── Retriever
    └── AI Service
```

## 2. High-Level Architecture

```text
                    FRONTEND
                       │
                       │ HTTP
                       ▼
                EXPRESS API
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Documents       Summaries      Questions
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
                Application Layer
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        PostgreSQL            AI Layer
             │                   │
             │               Gemini API
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

## 3. Frontend Layer

The frontend is a simple React + TypeScript application.

Responsibilities:

- Upload PDFs.
- Display documents.
- Display summaries.
- Request question generation.
- Display generated questions.
- Send chat questions.
- Display AI answers.

The frontend communicates with the backend through HTTP.

## 4. API Layer

Express exposes the REST API.

Main responsibilities:

- Receive HTTP requests.
- Route requests to the correct module.
- Perform request-level validation.
- Return HTTP responses.
- Forward application work to services.

Controllers should not contain complex business logic.

## 5. Application Layer

The application layer contains the feature modules:

```text
Documents
Summaries
Questions
Chat
```

Services coordinate application operations.

Repositories handle database access.

The application layer should not directly implement PDF parsing or raw Gemini API communication.

## 6. AI Layer

The AI layer abstracts Gemini.

```text
AIService
    ↓
AIProvider
    ↓
GeminiProvider
    ↓
Gemini API
```

Example provider:

```typescript
export interface AIProvider {
  summarize(text: string): Promise<string>;

  generateQuestions(text: string): Promise<Question[]>;

  answerQuestion(
    question: string,
    context: string
  ): Promise<string>;
}
```

This allows another AI provider to be introduced later without rewriting application services.

## 7. PDF Layer

PDF processing is isolated from application modules.

```text
PDF Service
    ↓
PDF Extractor
    ↓
Extracted Text
```

The PDF extractor knows how to extract text.

The PDF service coordinates the application-level PDF processing.

## 8. Embedding Layer

Embedding generation is separate from normal AI text generation.

```text
EmbeddingService
    ↓
EmbeddingProvider
    ↓
Gemini Embedding Model
    ↓
Vector
```

The application uses the embedding service instead of calling the embedding API directly throughout the application.

## 9. RAG Layer

The RAG layer coordinates document retrieval.

```text
RAG Service
│
├── Embedding Service
│
├── Retriever
│
└── AI Service
```

### RAG Process

```text
Student Question
       ↓
Generate Question Embedding
       ↓
Vector Similarity Search
       ↓
Retrieve Relevant Chunks
       ↓
Build Context
       ↓
AI Service
       ↓
Gemini
       ↓
Answer
```

## 10. Phase 1 Architecture

Phase 1 does not use vector retrieval.

```text
Frontend
    ↓
Express
    ↓
Chat Service
    ↓
Document Repository
    ↓
Extracted Text
    ↓
AI Service
    ↓
Gemini
    ↓
Answer
```

Summary and question generation follow a similar pattern.

## 11. Phase 2 Architecture

Phase 2 adds embeddings and RAG.

### Document Processing

```text
PDF
 ↓
PDF Extractor
 ↓
Extracted Text
 ↓
Chunker
 ↓
Document Chunks
 ↓
Embedding Service
 ↓
Embeddings
 ↓
PostgreSQL + pgvector
```

### Question Answering

```text
Student Question
 ↓
Embedding Service
 ↓
Question Vector
 ↓
Retriever
 ↓
pgvector
 ↓
Top Relevant Chunks
 ↓
RAG Service
 ↓
AI Service
 ↓
Gemini
 ↓
Answer
```

## 12. Layer Responsibilities

### Controller

Responsible for:

- HTTP request handling.
- Request/response conversion.
- Calling application services.

### Service

Responsible for:

- Business/application logic.
- Coordinating multiple dependencies.
- Validating application state.
- Managing workflows.

### Repository

Responsible for:

- Database queries.
- Creating records.
- Reading records.
- Updating records.
- Deleting records.

### Infrastructure

Responsible for external technical dependencies:

- Gemini.
- Embedding models.
- PDF extraction.
- pgvector retrieval.

## 13. Core Principle

Do not make the AI the architecture.

AI is an infrastructure dependency of the application.

The application should remain structured around its features:

```text
Documents
Summaries
Questions
Chat
```

AI, embeddings, PDF extraction, and vector retrieval provide capabilities used by those features.

## 14. Final Architecture

```text
                         React
                           │
                           ▼
                    Express API
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Documents        Summaries        Questions
          │                │                │
          └────────────────┼────────────────┘
                           │
                       Services
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
         Repositories              AI Service
              │                         │
              ▼                         ▼
         PostgreSQL                AI Provider
              │                         │
              │                      Gemini
              │
              ▼
          pgvector
              ▲
              │
          Retriever
              ▲
              │
          RAG Service
              ▲
              │
         Chat Service
```

## 15. MVP Architecture Scope

Keep the architecture simple.

Do not introduce:

- Microservices
- Redis
- Kubernetes
- Queues
- Authentication
- Multiple AI providers
- Model hosting
- LoRA
- Fine-tuning
- AI agents

The purpose of the MVP is to establish a working modular backend, AI integration, embeddings, vector retrieval, and RAG pipeline.
