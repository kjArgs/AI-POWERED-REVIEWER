import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Layers3, Library, MessageSquare, Plus, Search, Sparkles, UploadCloud, X } from 'lucide-react';
import { api, dateOf, message, titleOf, type DocumentMeta, type StudyDocument } from './api';
import { ErrorNotice, Modal, Spinner } from './components/Shared';
import { UploadDialog } from './components/DocumentDialogs';
import { Workspace } from './components/Workspace';

export default function App() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [selected, setSelected] = useState<DocumentMeta | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const [upload, setUpload] = useState(false);
  const [guide, setGuide] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async (nextOffset = 0) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError('');
    try {
      const result = await api.list(nextOffset, controller.signal);
      if (controller.signal.aborted) return;
      setDocuments(previous => nextOffset ? [...previous, ...result.documents.filter(doc => !previous.some(p => p.id === doc.id))] : result.documents);
      setOffset(nextOffset + result.documents.length);
      setMore(result.documents.length === result.limit);
    } catch (error) { if (!controller.signal.aborted) setError(message(error)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer); } }, [notice]);
  function uploaded(doc: StudyDocument) {
    setUpload(false); setSelected(doc); setNotice('Your document is ready to study.'); void load();
  }
  const filtered = documents.filter(doc => `${titleOf(doc)} ${doc.filename}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setSelected(null); }} aria-label="Margin home"><span className="brand-mark"><BookOpen size={22} strokeWidth={1.7} /></span><span>margin<span className="brand-period">.</span></span></a>
      <div className="workspace-label"><span className="workspace-avatar">M</span><div>My study space<small>A little clarity, every day</small></div></div>
      <p className="nav-caption">WORKSPACE</p>
      <nav aria-label="Main navigation"><button className={`nav-item ${!selected ? 'active' : ''}`} onClick={() => setSelected(null)}><Library size={18} />My library<span className="nav-count">{documents.length}{more ? '+' : ''}</span></button><button className="nav-item" onClick={() => setGuide(true)}><BookOpen size={18} />Study guide<ArrowUpRight className="nav-arrow" size={14} /></button></nav>
      <div className="sidebar-recents"><p className="nav-caption">RECENT DOCUMENTS</p>{documents.slice(0, 5).map(doc => <button className={`recent-item ${selected?.id === doc.id ? 'selected' : ''}`} key={doc.id} onClick={() => setSelected(doc)} title={titleOf(doc)}><FileText size={16} /><span>{titleOf(doc)}</span></button>)}{!documents.length && <p className="sidebar-empty">Your next discovery<br />starts with a document.</p>}</div>
      <div className="sidebar-bottom"><span className="tiny-spark"><Sparkles size={18} /></span><strong>Make room for understanding.</strong><p>Less time sorting through notes.<br />More time connecting the dots.</p><span className="small-label">YOUR AI STUDY COMPANION</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><button onClick={() => setSelected(null)}>My library</button>{selected && <><span className="slash">/</span><span className="breadcrumb-document">{titleOf(selected)}</span></>}</div><span className="topbar-note"><span className="small-dot" />A space to focus</span></header>
      <main id="main" tabIndex={-1}>
        {selected ? <Workspace key={selected.id} meta={selected} onBack={() => setSelected(null)} onUpdated={doc => { setSelected(doc); setDocuments(previous => previous.map(item => item.id === doc.id ? doc : item)); setNotice('Document renamed.'); }} onDeleted={() => { setSelected(null); setNotice('Document deleted.'); void load(); }} /> : <>
          <div className="page-heading"><div><p className="eyebrow">A LITTLE LESS OVERWHELM. A LITTLE MORE UNDERSTANDING.</p><h1>Your study space.</h1><p className="lead">Bring your materials. Find your clarity.</p></div><button className="button primary" onClick={() => setUpload(true)}><Plus size={18} />Upload PDF</button></div>
          <section className="welcome-card" aria-label="Get started"><div className="welcome-copy"><span className="pill"><Sparkles size={13} />FROM READING TO UNDERSTANDING</span><h2>Big ideas.<br />A clearer picture.</h2><p>Turn dense readings into clear summaries,<br className="desktop-break" /> thoughtful questions, and useful conversations.</p><button className="text-button" onClick={() => setUpload(true)}>Start with a document<ArrowRight size={17} /></button></div><div className="paper-scene" aria-hidden="true"><div className="paper paper-back" /><div className="paper paper-front"><span className="paper-overline">THE BIG PICTURE</span><div className="paper-title">A little clarity<br />goes a long way.</div><span className="paper-rule" /><span className="paper-rule short" /><div className="paper-highlight">Understand. Connect. Remember.</div><span className="paper-rule" /><span className="paper-rule medium" /><div className="paper-footer"><span>YOUR NOTES, REIMAGINED</span><Sparkles size={16} /></div></div><span className="paper-stamp"><BookOpen size={23} /></span></div></section>
          <section className="library-section" aria-labelledby="library-heading"><div className="section-heading"><div className="section-title"><h2 id="library-heading">Your library</h2><span className="count-badge">{documents.length}{more ? '+' : ''}</span></div><div className="search-field"><Search size={17} /><input aria-label="Search loaded documents" placeholder="Find a document…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}</div></div>
            {error && <ErrorNotice retry={() => void load(offset && documents.length ? offset : 0)}>{error}</ErrorNotice>}
            {loading && !documents.length ? <div className="loading-library"><Spinner label="Opening your library…" /></div> : !documents.length && !error ? <div className="empty-library"><span className="empty-icon"><Layers3 size={30} strokeWidth={1.3} /></span><h3>A fresh page for your ideas.</h3><p>Upload your first PDF to start building<br />your own little library of understanding.</p><button className="button secondary" onClick={() => setUpload(true)}><Plus size={16} />Add your first document</button><small>PDF documents · Notes, chapters, and readings</small></div> : <div className="document-grid">{filtered.map(doc => <button className="document-card" key={doc.id} onClick={() => setSelected(doc)}><span className="document-card-top"><span className="file-icon"><FileText size={22} strokeWidth={1.5} /></span><span className="file-type">PDF</span></span><h3>{titleOf(doc)}</h3><p>{doc.filename}</p><span className="document-card-footer"><span>{dateOf(doc.created_at)}</span><ArrowUpRight size={17} /></span></button>)}</div>}
            {!!documents.length && !filtered.length && <div className="search-empty"><Search size={24} /><h3>No matching documents</h3><p>Try another title{more ? ' or load more documents below' : ''}.</p></div>}
            {more && <div className="load-more"><button className="button secondary" disabled={loading} onClick={() => void load(offset)}>{loading ? <Spinner label="Loading…" /> : 'Load more documents'}</button><small>Search applies to loaded documents.</small></div>}
          </section>
          <div className="feature-strip"><div><span>01</span><div><strong>Find the essentials</strong><p>Clear summaries of the big ideas.</p></div></div><div><span>02</span><div><strong>Put yourself to the test</strong><p>Practice that makes learning stick.</p></div></div><div><span>03</span><div><strong>Follow your curiosity</strong><p>Ask questions. Connect the dots.</p></div></div></div>
        </>}
        <footer className="page-footer"><span>Made for your next “aha” moment.</span><span>margin<span className="brand-period">.</span></span></footer>
      </main>
    </div>
    {upload && <UploadDialog onClose={() => setUpload(false)} onUploaded={uploaded} />}
    {guide && <Modal title="A small guide to better studying" onClose={() => setGuide(false)}><div className="guide-steps"><div><UploadCloud /><h3>Start with your material</h3><p>Upload a text-based PDF. Give it a familiar title so it’s easy to find later.</p></div><div><FileText /><h3>Get the big picture</h3><p>Generate a summary, then revisit the source text for the details that matter.</p></div><div><Sparkles /><h3>Practice before you peek</h3><p>Answer the study questions first. Reveal the answers when you’re ready to check your understanding.</p></div><div><MessageSquare /><h3>Ask one more question</h3><p>Ask about a tricky idea in your document. Check the source passages and verify important details in your notes.</p></div></div><button className="button primary full-width" onClick={() => setGuide(false)}>Ready to learn<ArrowRight size={17} /></button></Modal>}
    {notice && <div className="toast" role="status">{notice}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15} /></button></div>}
  </div>;
}
