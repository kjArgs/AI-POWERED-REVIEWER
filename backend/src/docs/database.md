# AI Study Helper — Database

## 1. Database Technology

The MVP uses:

- PostgreSQL
- Kysely
- pgvector

Enable pgvector with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. Documents Table

The `documents` table stores uploaded document information and extracted text.

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Columns

| Column | Purpose |
|---|---|
| `id` | Unique document identifier |
| `filename` | Original uploaded filename |
| `title` | Optional document title |
| `extracted_text` | Text extracted from the PDF |
| `created_at` | Document creation timestamp |

## 3. Document Chunks Table

The `document_chunks` table stores smaller sections of a document and their embeddings.

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

### Columns

| Column | Purpose |
|---|---|
| `id` | Unique chunk identifier |
| `document_id` | Document that owns the chunk |
| `chunk_index` | Position of the chunk within the document |
| `content` | Text contained in the chunk |
| `embedding` | Vector representation of the chunk |
| `created_at` | Chunk creation timestamp |

### Important Rule

`VECTOR(768)` is only an example. The vector dimension must match the actual embedding model being used.

## 4. Summaries Table

The `summaries` table stores generated document summaries.

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

### Columns

| Column | Purpose |
|---|---|
| `id` | Unique summary identifier |
| `document_id` | Document associated with the summary |
| `content` | Generated summary |
| `created_at` | Summary creation timestamp |

## 5. Relationships

The primary database relationship is:

```text
documents
    │
    ├── summaries
    │
    └── document_chunks
             │
             └── embedding
```

Both `summaries` and `document_chunks` reference `documents`.

## 6. Document Chunk Relationship

```text
documents.id
     │
     └────────────── document_chunks.document_id
```

A document can have multiple chunks.

```text
Document
 ├── Chunk 1
 ├── Chunk 2
 ├── Chunk 3
 └── Chunk 4
```

## 7. Summary Relationship

```text
documents.id
     │
     └────────────── summaries.document_id
```

A summary belongs to a document.

## 8. Cascade Behavior

Both `summaries` and `document_chunks` use:

```sql
ON DELETE CASCADE
```

Therefore, deleting a document also removes its associated summaries and chunks.

## 9. Vector Retrieval

Conceptually, the retriever searches chunks belonging to a document and orders them by vector similarity.

```sql
SELECT
    id,
    content
FROM document_chunks
WHERE document_id = ?
ORDER BY embedding <=> ?
LIMIT 5;
```

The exact similarity operator depends on the selected vector similarity metric.

## 10. Database Responsibilities

The database is responsible for:

- Persisting documents.
- Persisting extracted text.
- Persisting summaries.
- Persisting document chunks.
- Persisting embeddings.
- Maintaining document-to-summary relationships.
- Maintaining document-to-chunk relationships.
- Supporting vector similarity search through pgvector.

Business decisions and application validation should remain in the service/application layer rather than being placed entirely in database queries.
