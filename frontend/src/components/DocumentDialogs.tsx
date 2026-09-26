import { useRef, useState, type FormEvent } from 'react';
import { FileText, UploadCloud, ArrowUpRight, Check } from 'lucide-react';
import { api, message, titleOf, type DocumentMeta, type StudyDocument } from '../api';
import { ErrorNotice, Modal, Spinner } from './Shared';

export function UploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: (doc: StudyDocument) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function select(files: FileList | null) {
    setError('');
    if (!files?.length) return;
    const next = files[0];
    if (files.length !== 1 || !next.name.toLowerCase().endsWith('.pdf')) { setError('Choose one PDF document.'); return; }
    if (!next.size) { setError('This file is empty. Choose a PDF with some content.'); return; }
    setFile(next);
    setTitle(next.name.replace(/\.pdf$/i, '').slice(0, 255));
  }
  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true); setError('');
    try { onUploaded(await api.upload(file, title)); }
    catch (error) { setError(message(error)); setBusy(false); }
  }
  return <Modal title="Add to your library" onClose={onClose} busy={busy}>
    <p className="muted modal-description">Bring your notes, readings, or textbook chapters. We’ll help you make sense of them.</p>
    <form onSubmit={upload}>
      <input ref={input} type="file" accept=".pdf,application/pdf" aria-label="Choose PDF" className="visually-hidden" disabled={busy} onChange={event => select(event.target.files)} />
      <button type="button" disabled={busy} className={`upload-zone ${dragging ? 'dragging' : ''}`} onClick={() => input.current?.click()}
        onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) select(event.dataTransfer.files); }}>
        <span className="upload-symbol">{file ? <FileText size={25} /> : <UploadCloud size={25} />}</span>
        <strong>{file ? file.name : 'Drop your PDF here'}</strong>
        <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Click to choose another` : 'or click to browse your files'}</span>
      </button>
      <label className="field-label" htmlFor="document-title">Document title <span className="muted">(optional)</span></label>
      <input id="document-title" value={title} maxLength={255} disabled={busy} onChange={event => setTitle(event.target.value)} placeholder="Give your material a name" />
      <p className="field-help">Text-based PDFs work best. Scanned pages need text recognition first.</p>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {busy && <div className="processing"><Spinner label="Preparing your document…" /><p>Extracting the text and getting it ready to study. Larger documents may take a few minutes.</p></div>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button primary" disabled={!file || busy}>{busy ? 'Preparing…' : 'Upload document'}<ArrowUpRight size={17} /></button></div>
    </form>
  </Modal>;
}

export function ManageDialog({ doc, mode, onClose, onDone }: { doc: DocumentMeta; mode: 'rename' | 'delete'; onClose: () => void; onDone: (doc?: StudyDocument) => void }) {
  const [title, setTitle] = useState(titleOf(doc));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      if (mode === 'delete') { await api.delete(doc.id); onDone(); }
      else onDone(await api.rename(doc.id, title.trim()));
    } catch (error) { setError(message(error)); setBusy(false); }
  }
  return <Modal title={mode === 'delete' ? 'Delete this document?' : 'Rename document'} onClose={onClose} busy={busy}>
    <form onSubmit={submit}>
      {mode === 'delete' ? <p className="modal-description">“{titleOf(doc)}” and its saved summary will be permanently removed from your library. This cannot be undone.</p> : <><label className="field-label" htmlFor="rename-title">Document title</label><input id="rename-title" required autoFocus maxLength={255} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} /></>}
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button primary" disabled={busy || (mode === 'rename' && !title.trim())}>{busy ? <Spinner label="Saving…" /> : mode === 'delete' ? 'Delete document' : <><Check size={16} />Save changes</>}</button></div>
    </form>
  </Modal>;
}
