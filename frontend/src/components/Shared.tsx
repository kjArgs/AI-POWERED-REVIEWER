import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, LoaderCircle, X } from 'lucide-react';
import Markdown from 'react-markdown';

export function Spinner({ label = 'Working…' }: { label?: string }) {
  return <span className="working" role="status"><LoaderCircle size={16} className="spin" />{label}</span>;
}
export function ErrorNotice({ children, retry }: { children: ReactNode; retry?: () => void }) {
  return <div className="error-notice" role="alert"><AlertCircle size={18} /><span>{children}</span>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div>;
}
export function Prose({ children }: { children: string }) {
  return <div className="prose"><Markdown components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{children}</Markdown></div>;
}
export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="modal-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><X size={20} /></button></div>
    {children}
  </dialog>;
}
