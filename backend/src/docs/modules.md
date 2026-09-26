# AI Study Helper — Modules

## 1. Documents Module

```text
modules/documents/
├── document.controller.ts
├── document.service.ts
├── document.repository.ts
└── document.routes.ts
```

### Responsibility

The Documents Module manages uploaded documents and document CRUD operations.

### Controller

- Receives HTTP requests.
- Handles request-level information.
- Returns HTTP responses.

### Service

- Coordinates document creation.
- Validates application requirements.
- Coordinates PDF processing.
- Coordinates document storage.

### Repository

- Creates documents.
- Finds documents.
- Lists documents.
- Deletes documents.

## 2. Summaries Module

```text
modules/summaries/
├── summary.controller.ts
├── summary.service.ts
└── summary.routes.ts
```

### Responsibility

Generates and stores document summaries.

### Flow

```text
Get Document
    ↓
Get Extracted Text
    ↓
AI Service
    ↓
Generate Summary
    ↓
Save Summary
```

## 3. Questions Module

```text
modules/questions/
├── question.controller.ts
├── question.service.ts
└── question.routes.ts
```

### Responsibility

Generates study questions from document text.

### Flow

```text
Get Document
    ↓
Get Extracted Text
    ↓
AI Service
    ↓
Generate Questions
    ↓
Return Questions
```

## 4. Chat Module

```text
modules/chat/
├── chat.controller.ts
├── chat.service.ts
└── chat.routes.ts
```

### Responsibility

Handles student questions about documents.

### Phase 1

```text
Chat Service
    ↓
Document Text
    ↓
AI Service
    ↓
Gemini
```

### Phase 2

```text
Chat Service
    ↓
RAG Service
    ↓
Relevant Context
    ↓
AI Service
    ↓
Gemini
```

The Chat Module should not contain vector-search implementation details.

## 5. AI Infrastructure

```text
infrastructure/ai/
├── ai.provider.ts
├── ai.service.ts
├── gemini.provider.ts
└── prompts/
    ├── summary.prompt.ts
    ├── question.prompt.ts
    └── chat.prompt.ts
```

### Responsibility

Provides text-generation capabilities to application modules.

### Flow

```text
Application
    ↓
AIService
    ↓
AIProvider
    ↓
GeminiProvider
    ↓
Gemini API
```

The application should depend on the `AIProvider` abstraction instead of directly calling Gemini throughout the application.

## 6. PDF Infrastructure

```text
infrastructure/pdf/
├── pdf-extractor.ts
└── pdf.service.ts
```

### PDF Extractor

Responsible for:

```text
PDF → Text
```

### PDF Service

Responsible for coordinating:

```text
Uploaded File
    ↓
Validation
    ↓
Extraction
    ↓
Prepared Document Data
```

## 7. Embedding Infrastructure

```text
infrastructure/embeddings/
├── embedding.provider.ts
├── embedding.service.ts
└── gemini.embedding.ts
```

### Responsibility

Provides text-to-vector embedding capabilities.

### Flow

```text
Text
    ↓
EmbeddingService
    ↓
EmbeddingProvider
    ↓
Gemini Embedding Model
    ↓
Vector
```

Embedding generation should remain separate from normal text generation.

## 8. RAG Infrastructure

```text
infrastructure/rag/
├── chunker.ts
├── retriever.ts
└── rag.service.ts
```

### Chunker

```text
Text
 ↓
Chunks
```

### Retriever

```text
Question Embedding
    ↓
pgvector
    ↓
Relevant Chunks
```

### RAG Service

Coordinates:

```text
Question
    ↓
EmbeddingService
    ↓
Retriever
    ↓
Context
    ↓
AIService
    ↓
Answer
```

## 9. Infrastructure vs Application Modules

Application modules contain feature-specific application logic:

```text
Documents
Summaries
Questions
Chat
```

Infrastructure provides technical capabilities:

```text
AI
PDF
Embeddings
RAG
Database
```

The application modules should use infrastructure through clear service or provider boundaries.
