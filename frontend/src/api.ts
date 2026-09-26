export interface DocumentMeta { id: number; filename: string; title: string | null; created_at: string }
export interface StudyDocument extends DocumentMeta { extracted_text: string | null }
export interface Summary { documentId: number; summary: string; id: number; createdAt: string }
export interface Question { question: string; choices: string[]; answer: string }
export interface Source { id: number; chunk_index: number; content: string; similarity: number }
export interface Answer { documentId: number; answer: string; sources: Source[]; mode: 'rag' | 'basic' }
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`${base}/api${path}`, options); }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('We couldn’t reach your study space. Check your connection and try again.', 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.message || 'Your study space is temporarily unavailable. Please try again.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
const json = (value: unknown): RequestInit => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
export const api = {
  list: (offset = 0, signal?: AbortSignal) => request<{ documents: DocumentMeta[]; limit: number; offset: number }>(`/documents?limit=20&offset=${offset}`, { signal }),
  document: (id: number, signal?: AbortSignal) => request<StudyDocument>(`/documents/${id}`, { signal }),
  upload: (file: File, title: string) => {
    const body = new FormData(); body.append('file', file); if (title.trim()) body.append('title', title.trim());
    return request<StudyDocument>('/documents', { method: 'POST', body });
  },
  rename: (id: number, title: string) => request<StudyDocument>(`/documents/${id}`, { method: 'PATCH', ...json({ title }) }),
  delete: (id: number) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
  summary: (id: number, signal?: AbortSignal) => request<Summary>(`/documents/${id}/summary`, { signal }),
  generateSummary: (id: number, signal?: AbortSignal) => request<Summary>(`/documents/${id}/summary`, { method: 'POST', signal }),
  questions: (id: number, signal?: AbortSignal) => request<{ questions: Question[] }>(`/documents/${id}/questions`, { method: 'POST', signal }),
  chat: (id: number, question: string, signal?: AbortSignal) => request<Answer>(`/documents/${id}/chat`, { method: 'POST', signal, ...json({ question }) }),
};
export function message(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
export function titleOf(doc: DocumentMeta) { return doc.title || doc.filename; }
export function dateOf(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
