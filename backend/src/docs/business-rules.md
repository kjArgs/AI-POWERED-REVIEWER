# AI Study Helper — Business Logic

## 1. Document Management

The system allows students to upload PDF documents, extract their text, store the document information, retrieve documents, list documents, and delete documents.

### Rules

- The uploaded file must be a PDF.
- The PDF must be validated before processing.
- Text must be extracted from the PDF.
- The document and extracted text must be stored.
- A document must exist before summary, question generation, or chat operations can be performed.

### Flow

```text
Upload PDF
    ↓
Validate PDF
    ↓
Extract Text
    ↓
Create Document
    ↓
Store Document
```

## 2. Summary Generation

The system generates a summary from an uploaded document.

### Rules

- The requested document must exist.
- The document must contain extracted text.
- The extracted text is sent to the AI provider.
- The generated summary is returned and can be stored.

### Flow

```text
Document
    ↓
Extracted Text
    ↓
AI Provider
    ↓
Generated Summary
    ↓
Store Summary
```

## 3. Question Generation

The system generates approximately five study questions from a document.

### Rules

- The requested document must exist.
- The document text is provided to the AI provider.
- Approximately five questions are generated.
- Questions contain a question, choices, and an answer.
- Structured output should be preferred.

### Flow

```text
Document
    ↓
Extracted Text
    ↓
Gemini
    ↓
Questions
    ↓
Return Questions
```

## 4. Basic Document Chat

Phase 1 allows students to ask questions about a document.

### Rules

- The requested document must exist.
- A student question is required.
- The document's extracted text is used as context.
- Gemini generates the answer.

### Flow

```text
Question + Document Text
    ↓
Gemini
    ↓
Answer
```

## 5. Document Chunking

Phase 2 divides extracted document text into smaller chunks for retrieval.

### Rules

- Text is divided into approximately 500–1000 token chunks.
- Chunks use a small overlap.
- Chunk ordering is preserved using `chunk_index`.
- The MVP should keep chunking simple.

### Flow

```text
Extracted Text
    ↓
Chunk Text
    ↓
Multiple Chunks
```

## 6. Embedding Generation

Each document chunk receives an embedding.

### Rules

- Each chunk is sent to the embedding provider.
- The generated vector is stored with the chunk.
- The PostgreSQL vector dimension must match the actual embedding model.

### Flow

```text
Chunk
    ↓
Embedding Provider
    ↓
Vector
    ↓
PostgreSQL + pgvector
```

## 7. Vector Retrieval

The system retrieves relevant chunks when a student asks a question.

### Rules

- The student's question is converted into an embedding.
- Vector similarity search is performed.
- Search is restricted to the requested document.
- The most relevant chunks are returned.
- The number of retrieved chunks is limited, such as top 5.

### Flow

```text
Student Question
    ↓
Question Embedding
    ↓
Vector Similarity Search
    ↓
Relevant Chunks
```

## 8. RAG Answer Generation

The retrieved chunks are provided to Gemini as context.

### Rules

- The RAG service retrieves relevant chunks.
- The chunks are combined into context.
- The context and student question are sent to Gemini.
- Gemini generates an answer based on the provided context.
- If the answer cannot be found in the context, the system should indicate that the information is not available in the document.

### Flow

```text
Question
    ↓
Question Embedding
    ↓
Vector Search
    ↓
Relevant Chunks
    ↓
Build Context
    ↓
Gemini
    ↓
Answer
```

## 9. Phase 1 Business Flow

```text
PDF
 ↓
Extract Text
 ↓
Store Document
 ↓
Gemini
 ├── Summary
 ├── Questions
 └── Basic Chat
```

## 10. Phase 2 Business Flow

```text
PDF
 ↓
Extract Text
 ↓
Chunk Text
 ↓
Generate Embeddings
 ↓
Store in PostgreSQL + pgvector

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
Gemini
 ↓
Answer
```

## 11. MVP Scope

The MVP does not include:

- Authentication
- User profiles
- Multiple AI providers
- LoRA
- Fine-tuning
- Model hosting
- Redis
- Microservices
- Kubernetes
- Advanced analytics
- Recommendation systems
- AI agents
- Complex study tracking
