# Margin — React frontend

A minimal study workspace for the AI Study Helper backend. Built with React, TypeScript, and Vite, using off-white surfaces, charcoal text, and a muted terracotta accent. Fonts are bundled locally; no external font service is required.

## Run

Use Node.js 22.13+ and start the backend on port 3000 (see [backend setup](../backend/README.md)). From this directory:

```sh
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` requests to `http://localhost:3000`. To change the backend port, copy `.env.example` to `.env` and adjust `API_PROXY_TARGET`. A database with pgvector and a valid Gemini key are needed for the real backend features.

## Available flows

- Upload one PDF with an optional title, by browsing or dropping a file into the upload dialog.
- Browse, search loaded documents, and load additional pages of the library.
- Open, rename, and delete documents, with confirmation before deletion.
- Generate a summary, reload saved summaries, and copy the summary text.
- Generate five practice questions, choose answers, reveal a score, and retry.
- Ask questions about a document and expand the retrieved source passages.
- Read the extracted source text.

Upload size limits and PDF validation are enforced by the backend; the default file limit is 10 MB. Larger documents may take several minutes to process. Summaries and documents are persisted by the backend. Practice answers and chat messages are local UI state and reset when leaving a document or refreshing the page. Each chat question is independent, matching the current backend API.

The frontend has no authentication because it follows the backend MVP scope. It reflects the shared document library, not a per-user account.

## Production

```sh
npm run build
npm run preview
```

Deploy `dist/` to a static host. Configure that host to proxy `/api` to the backend. Alternatively, set `VITE_API_BASE_URL=https://your-api.example.com` **before building**, and configure the backend `CORS_ORIGIN` to match the frontend origin. The Vite development proxy is not part of the production build or preview server.

Never put `GEMINI_API_KEY`, database credentials, or other secrets in `VITE_*` variables; those variables are public browser configuration.

## Browser tests

```sh
npx playwright install chromium
npm test
```

Playwright runs desktop and mobile flows with mocked API responses on port 5174. Tests cover upload, summary rendering, practice scoring, chat sources, rename/delete, recoverable failures, search, dialog dismissal, and horizontal overflow. Screenshots and traces are written to the ignored `test-results` directory. Tests do not call Gemini or alter the real database.

Reference: [React setup](https://react.dev/learn/build-a-react-app-from-scratch) and [Vite configuration](https://vite.dev/guide/).
