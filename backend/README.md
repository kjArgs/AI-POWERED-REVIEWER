# AI Study Helper backend

Express + TypeScript API implementing the modules in `src/docs/modules.md`. It stores document text, summaries, and 768-dimensional embeddings in PostgreSQL, extracts PDF text with `pdf-parse`, and uses Ollama Cloud for summaries, multiple-choice questions, document chat, and embeddings.

## Run locally

Requirements: Node.js 22.13+ and PostgreSQL with the `vector` extension available. Docker is an optional way to provide PostgreSQL and pgvector together.

From the project root, if using Docker:

```sh
docker compose up -d db
```

The Compose database uses port 5432 and local development credentials. If another PostgreSQL server already occupies that port, change the host side of the port mapping (for example `127.0.0.1:5433:5432`) and the port in `DATABASE_URL`.

From `backend`:

```sh
npm ci
```

Create `.env` from `.env.example` if it does not already exist. Keep existing credentials when editing an existing file. Set `DATABASE_URL` to an existing database and set `OLLAMA_API_KEY` to a valid Ollama Cloud API key. The Compose database URL is shown in `.env.example`.

```sh
npm run migrate
npm run dev
```

The migration role must be able to create the `vector` extension, or an administrator must enable it in the selected database first. Migrations create tables; they do not create the database or install PostgreSQL extension binaries.

For a compiled build:

```sh
npm run build
npm run migrate:prod
npm start
```

The API defaults to `http://localhost:3000`. `GET /health` reports process health. `GET /health/ready` checks database connectivity and required tables and returns 503 when they are unavailable.

## Configuration

| Variable                 | Default / purpose                                            |
| ------------------------ | ------------------------------------------------------------ |
| `DATABASE_URL`           | Required PostgreSQL connection URL                           |
| `OLLAMA_API_KEY`         | Required Ollama Cloud API key                                |
| `OLLAMA_BASE_URL`        | `https://ollama.com/api`                                     |
| `PORT`                   | `3000`                                                       |
| `OLLAMA_MODEL`           | `gemma4:31b`                                                 |
| `OLLAMA_EMBEDDING_MODEL` | `embeddinggemma` (must return 768 dimensions)                |
| `CHAT_MODE`              | `rag`; use `basic` for full-document chat without embeddings |
| `CORS_ORIGIN`            | `http://localhost:5173`                                      |
| `MAX_UPLOAD_MB`          | `10` (maximum 50)                                            |
| `MAX_DOCUMENT_CHARS`     | `200000` (maximum 1000000)                                   |

RAG mode embeds chunks during upload and saves the document and all chunks in one transaction after embedding succeeds. Basic mode stores documents without embeddings. Documents uploaded in basic mode must be re-uploaded with RAG enabled before RAG chat can use them. Also re-upload documents after changing embedding models: different models produce incompatible vector spaces even with the same dimensions.

The embedding configuration follows [Google's task formatting and dimensionality guidance](https://ai.google.dev/gemini-api/docs/embeddings). Model names remain configurable because availability can change.

## API

| Method | Route                              | Input / result                                                  |
| ------ | ---------------------------------- | --------------------------------------------------------------- |
| GET    | `/health`                          | Process health                                                  |
| GET    | `/health/ready`                    | Database readiness                                              |
| POST   | `/api/documents`                   | Multipart `file` (PDF), optional `title`; returns document, 201 |
| GET    | `/api/documents?limit=20&offset=0` | Paginated metadata, newest first                                |
| GET    | `/api/documents/:id`               | Document including extracted text                               |
| PATCH  | `/api/documents/:id`               | JSON `{ "title": "New title" }`                                 |
| DELETE | `/api/documents/:id`               | Deletes document, summaries, and chunks; returns 204            |
| POST   | `/api/documents/:id/summary`       | Generates and saves a summary; returns 201                      |
| GET    | `/api/documents/:id/summary`       | Latest saved summary                                            |
| POST   | `/api/documents/:id/questions`     | Five questions with four choices and answer letter              |
| POST   | `/api/documents/:id/chat`          | JSON `{ "question": "What is photosynthesis?" }`                |

Upload using PowerShell (`curl.exe` avoids the PowerShell `curl` alias):

```powershell
curl.exe -F "file=@C:/path/to/study.pdf" -F "title=Biology" http://localhost:3000/api/documents
Invoke-RestMethod -Method Post http://localhost:3000/api/documents/1/summary
Invoke-RestMethod -Method Post http://localhost:3000/api/documents/1/questions
Invoke-RestMethod -Method Post http://localhost:3000/api/documents/1/chat -ContentType 'application/json' -Body '{"question":"What is photosynthesis?"}'
```

Summary response:

```json
{
  "documentId": 1,
  "summary": "Plants convert sunlight into chemical energy.",
  "id": 1,
  "createdAt": "2026-09-26T00:00:00.000Z"
}
```

RAG chat returns `documentId`, `answer`, `mode: "rag"`, and `sources` containing retrieved chunk IDs, zero-based `chunk_index`, content, and cosine similarity. Prompt citations use one-based `[Chunk N]` labels. Sources are the context supplied to Gemini; they are not independently verified claim-level citations. Basic chat returns `mode: "basic"` and an empty sources array. Chat requests are independent; conversation history is not persisted.

Errors use `{ "statusCode": 400, "message": "..." }`. Statuses include 400 for invalid input, 404 for missing resources, 409 for unindexed RAG documents, 413 for size limits, 422 for unreadable/textless PDFs, and 502 for AI failures. Unknown errors return a generic 500 without leaking provider or database details.

## Boundaries and limits

- Controllers validate HTTP inputs; services coordinate business behavior; the document repository owns persistence. AI and embedding providers are separate abstractions. Chat delegates retrieval to `RagService`.
- Only document metadata and extracted text are persisted; original PDF bytes are processed in memory and discarded.
- Image-only PDFs need OCR, which is outside this MVP. Uploads are limited by both file size and extracted text length.
- Upload indexing runs synchronously with at most three concurrent embedding requests. Long PDFs can take time and incur Gemini usage. There is no background queue or automatic retry.
- Summary and question generation use the whole extracted text within the configured size limit. Oversized documents are rejected, never silently truncated.
- Authentication is excluded by the project specification. This is a shared MVP API: every caller can access or delete stored documents. CORS controls browser access; it does not provide authentication.

## Verification

```sh
npm run build
npm test
```

Tests require no Gemini key, Docker, or running database. They use an isolated in-memory PGlite PostgreSQL engine with the real pgvector extension and real migrations, PDF parser, repositories, and HTTP routes. Deterministic providers replace Gemini. Tests cover the complete workflow, vector ranking and document isolation, basic mode, validation, transactional rollback, cascade deletion, and malformed AI output.
