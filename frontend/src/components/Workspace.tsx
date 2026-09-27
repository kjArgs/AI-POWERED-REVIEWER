import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  FileText,
  MessageSquare,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  api,
  ApiError,
  dateOf,
  message,
  titleOf,
  type Answer,
  type DocumentMeta,
  type QuestionSet,
  type StudyDocument,
  type Summary,
} from '../api';
import { ErrorNotice, Prose, Spinner } from './Shared';
import { ManageDialog } from './DocumentDialogs';

type Tab = 'summary' | 'questions' | 'chat' | 'source';
type Exchange = { question: string; response: Answer };

export function Workspace({
  meta,
  onBack,
  onUpdated,
  onDeleted,
}: {
  meta: DocumentMeta;
  onBack: () => void;
  onUpdated: (doc: StudyDocument) => void;
  onDeleted: () => void;
}) {
  const [document, setDocument] = useState<StudyDocument | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<Tab>('summary');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [questions, setQuestions] = useState<QuestionSet | null>(null);
  const [questionsBusy, setQuestionsBusy] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState('');
  const [chat, setChat] = useState<Exchange[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [manage, setManage] = useState<'rename' | 'delete' | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const controller = useRef<AbortController>(new AbortController());
  const endOfChat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const requests = new AbortController();
    controller.current = requests;
    setDocumentError('');
    setSummaryLoading(true);
    setSummaryError('');
    void api
      .document(meta.id, requests.signal)
      .then(setDocument)
      .catch((error) => {
        if (!requests.signal.aborted) setDocumentError(message(error));
      });
    void api
      .summary(meta.id, requests.signal)
      .then(setSummary)
      .catch((error) => {
        if (
          !requests.signal.aborted &&
          !(error instanceof ApiError && error.status === 404)
        )
          setSummaryError(message(error));
      })
      .finally(() => {
        if (!requests.signal.aborted) setSummaryLoading(false);
      });
    return () => requests.abort();
  }, [meta.id, revision]);
  useEffect(() => {
    if (tab === 'chat' && (chat.length || chatBusy))
      endOfChat.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
  }, [chat, chatBusy, tab]);
  useEffect(() => {
    if (copyStatus) {
      const timer = setTimeout(() => setCopyStatus(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  async function generateSummary() {
    if (summaryBusy) return;
    setSummaryBusy(true);
    setSummaryError('');
    const signal = controller.current.signal;
    try {
      const result = await api.generateSummary(meta.id, signal);
      if (!signal.aborted) setSummary(result);
    } catch (error) {
      if (!signal.aborted) setSummaryError(message(error));
    } finally {
      if (!signal.aborted) setSummaryBusy(false);
    }
  }
  async function generateQuestions() {
    if (questionsBusy) return;
    setQuestionsBusy(true);
    setQuestionsError('');
    const signal = controller.current.signal;
    try {
      const result = await api.questions(meta.id, signal);
      if (!signal.aborted) {
        setQuestions(result.questions);
        setAnswers({});
        setRevealed(false);
      }
    } catch (error) {
      if (!signal.aborted) setQuestionsError(message(error));
    } finally {
      if (!signal.aborted) setQuestionsBusy(false);
    }
  }
  async function ask(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || chatBusy) return;
    setChatBusy(true);
    setChatError('');
    setPendingQuestion(question);
    const signal = controller.current.signal;
    try {
      const response = await api.chat(meta.id, question, signal);
      if (!signal.aborted) {
        setChat((previous) => [...previous, { question, response }]);
        setDraft('');
      }
    } catch (error) {
      if (!signal.aborted) setChatError(message(error));
    } finally {
      if (!signal.aborted) {
        setChatBusy(false);
        setPendingQuestion('');
      }
    }
  }
  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.summary);
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Could not copy. Select the text to copy it manually.');
    }
  }
  const tabs = [
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'questions', name: 'Practice', icon: Sparkles },
    { id: 'chat', name: 'Ask a question', icon: MessageSquare },
    { id: 'source', name: 'Source text', icon: BookOpen },
  ] as const;
  const score =
    questions?.multiple_choice.filter(
      (question, index) => answers[`multiple-${index}`] === question.answer,
    ).length ?? 0;
  const working = summaryBusy || questionsBusy || chatBusy;

  return (
    <div className="study-workspace">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to library
      </button>
      <div className="document-heading">
        <div className="document-title-row">
          <span className="file-icon large">
            <FileText size={25} strokeWidth={1.4} />
          </span>
          <div>
            <p className="eyebrow">YOUR MATERIAL, MADE CLEARER</p>
            <h1>{titleOf(meta)}</h1>
            <p className="document-meta">
              <span>{meta.filename}</span>
              <span>Added {dateOf(meta.created_at)}</span>
            </p>
          </div>
        </div>
        <div className="document-tools">
          <button
            className="icon-button"
            aria-label="Rename document"
            onClick={() => setManage('rename')}
            disabled={working}
          >
            <Pencil size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Delete document"
            onClick={() => setManage('delete')}
            disabled={working}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <nav className="study-tabs" aria-label="Study tools">
        {tabs.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            aria-pressed={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {name}
          </button>
        ))}
      </nav>
      {documentError ? (
        <ErrorNotice retry={() => setRevision((value) => value + 1)}>
          {documentError}
        </ErrorNotice>
      ) : !document ? (
        <div className="panel-loading">
          <Spinner label="Opening your document…" />
        </div>
      ) : (
        <>
          {tab === 'summary' && (
            <section className="study-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">THE ESSENTIALS</span>
                  <h2>The big picture.</h2>
                  <p>A clear overview to help the important ideas fall into place.</p>
                </div>
                {summary && <button className="button secondary compact" disabled={summaryBusy || summaryLoading} onClick={() => void generateSummary()}><RotateCcw size={15} />Regenerate</button>}
              </div>
              {summaryError && <ErrorNotice retry={() => setRevision(value => value + 1)}>{summaryError}</ErrorNotice>}
              {summaryLoading ? <div className="panel-loading"><Spinner label="Checking for a saved summary…" /></div> : summary ? <div className="summary-content"><div className="summary-meta"><span><Check size={14} />Saved · {dateOf(summary.createdAt)}</span><button className="text-button" onClick={() => void copySummary()}><Copy size={14} />Copy</button></div>{copyStatus && <p role="status" className="field-help">{copyStatus}</p>}<Prose>{summary.summary}</Prose></div> : <div className="tool-empty"><span className="tool-icon"><FileText size={28} strokeWidth={1.3} /></span><h3>Less reading between the lines.</h3><p>Get a focused summary of your document’s main ideas<br className="desktop-break" /> and the details worth remembering.</p><button className="button primary" disabled={summaryBusy} onClick={() => void generateSummary()}><Sparkles size={16} />Generate summary</button></div>}
              {summaryBusy && (
                <div className="operation-status">
                  <Spinner label="Finding the essentials…" />
                </div>
              )}
            </section>
          )}
          {tab === 'questions' && (
            <section className="study-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">MAKE IT STICK</span>
                  <h2>A little practice goes a long way.</h2>
                  <p>
                    Five multiple-choice, enumeration, and explanation questions
                    from your material.
                  </p>
                </div>
                {questions && (
                  <button
                    className="button secondary compact"
                    disabled={questionsBusy}
                    onClick={() => void generateQuestions()}
                  >
                    <RotateCcw size={15} />
                    New questions
                  </button>
                )}
              </div>
              {questionsError && <ErrorNotice>{questionsError}</ErrorNotice>}
              {!questions ? (
                <div className="tool-empty">
                  <span className="tool-icon">
                    <Sparkles size={28} strokeWidth={1.3} />
                  </span>
                  <h3>What do you remember?</h3>
                  <p>Turn what you’ve read into a chance to test yourself.</p>
                  <button
                    className="button primary"
                    disabled={questionsBusy}
                    onClick={() => void generateQuestions()}
                  >
                    <Sparkles size={16} />
                    Generate questions
                  </button>
                </div>
              ) : (
                <PracticeContent
                  questions={questions}
                  answers={answers}
                  revealed={revealed}
                  questionsBusy={questionsBusy}
                  score={score}
                  onAnswer={(key, answer) =>
                    setAnswers((previous) => ({ ...previous, [key]: answer }))
                  }
                  onReveal={() => setRevealed(true)}
                  onRetry={() => {
                    setRevealed(false);
                    setAnswers({});
                  }}
                />
              )}
              {questionsBusy && (
                <div className="operation-status">
                  <Spinner label="Putting your practice together…" />
                </div>
              )}
            </section>
          )}
          {tab === 'chat' && (
            <section className="study-panel chat-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">FOLLOW YOUR CURIOSITY</span>
                  <h2>Let’s make it make sense.</h2>
                  <p>Ask a question grounded in this document.</p>
                </div>
              </div>
              <div
                className="chat-history"
                aria-live="polite"
                aria-busy={chatBusy}
              >
                {!chat.length && !chatBusy && (
                  <div className="chat-empty">
                    <span className="tool-icon">
                      <MessageSquare size={27} strokeWidth={1.3} />
                    </span>
                    <h3>Good questions open new doors.</h3>
                    <p>Start with something you’d like to understand better.</p>
                    <div className="suggestion-list">
                      {[
                        'What are the main ideas in this document?',
                        'Explain the most important concept simply.',
                        'How do the key ideas connect?',
                      ].map((question) => (
                        <button
                          key={question}
                          onClick={() => setDraft(question)}
                        >
                          {question}
                          <ArrowUpRightIcon />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chat.map((exchange, index) => (
                  <div className="exchange" key={index}>
                    <div className="student-message">
                      <span className="message-label">YOU</span>
                      <p>{exchange.question}</p>
                    </div>
                    <div className="assistant-message">
                      <span className="message-label">
                        <Sparkles size={14} />
                        MARGIN
                      </span>
                      <Prose>{exchange.response.answer}</Prose>
                      {exchange.response.sources.length > 0 && (
                        <details className="sources">
                          <summary>
                            <BookOpen size={14} />
                            {exchange.response.sources.length} source{' '}
                            {exchange.response.sources.length === 1
                              ? 'passage'
                              : 'passages'}
                            <ChevronDown size={14} />
                          </summary>
                          {exchange.response.sources.map((source) => (
                            <div className="source-passage" key={source.id}>
                              <strong>Chunk {source.chunk_index + 1}</strong>
                              <p>{source.content}</p>
                            </div>
                          ))}
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                {chatBusy && (
                  <div className="exchange">
                    <div className="student-message">
                      <span className="message-label">YOU</span>
                      <p>{pendingQuestion}</p>
                    </div>
                    <div className="assistant-message">
                      <Spinner label="Looking through your document…" />
                    </div>
                  </div>
                )}
                <div ref={endOfChat} />
              </div>
              {chatError && <ErrorNotice>{chatError}</ErrorNotice>}
              <form className="chat-form" onSubmit={ask}>
                <div className="composer">
                  <textarea
                    aria-label="Your question"
                    placeholder="What would you like to understand?"
                    maxLength={4000}
                    rows={2}
                    value={draft}
                    disabled={chatBusy}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button
                    className="send-button"
                    aria-label="Send question"
                    disabled={!draft.trim() || chatBusy}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="chat-note">
                  Each question uses your document, not previous messages. This
                  conversation resets when you leave the document.
                </p>
              </form>
            </section>
          )}
          {tab === 'source' && (
            <section className="study-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">BACK TO THE SOURCE</span>
                  <h2>In your own material.</h2>
                  <p>
                    The text extracted from your PDF. Original page layout may
                    differ.
                  </p>
                </div>
                <span className="count-badge">
                  {document.extracted_text?.length.toLocaleString() ?? 0}{' '}
                  characters
                </span>
              </div>
              <div className="source-text">
                {document.extracted_text ||
                  'No extracted text is available for this document.'}
              </div>
            </section>
          )}
          <p className="ai-note">
            <Sparkles size={13} />A little help from AI. Always check important
            details against your source.
          </p>
        </>
      )}
      {manage && (
        <ManageDialog
          doc={meta}
          mode={manage}
          onClose={() => setManage(null)}
          onDone={(doc) => {
            setManage(null);
            if (doc) onUpdated(doc);
            else onDeleted();
          }}
        />
      )}
    </div>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={15} className="suggestion-arrow" />;
}

function PracticeContent({
  questions,
  answers,
  revealed,
  questionsBusy,
  score,
  onAnswer,
  onReveal,
  onRetry,
}: {
  questions: QuestionSet;
  answers: Record<string, string>;
  revealed: boolean;
  questionsBusy: boolean;
  score: number;
  onAnswer: (key: string, answer: string) => void;
  onReveal: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="practice-content">
      <div className="practice-category">
        <span className="section-kicker">MULTIPLE CHOICE</span>
        {questions.multiple_choice.map((question, index) => (
          <fieldset
            className="question-card"
            key={`multiple-${index}`}
            disabled={revealed || questionsBusy}
          >
            <legend>
              <span className="question-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              {question.question}
            </legend>
            <div className="choices">
              {question.choices.map((choice, choiceIndex) => {
                const letter = String.fromCharCode(65 + choiceIndex);
                const correct = revealed && question.answer === letter;
                return (
                  <label
                    className={`choice ${answers[`multiple-${index}`] === letter ? 'chosen' : ''} ${correct ? 'correct' : ''}`}
                    key={letter}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={letter}
                      checked={answers[`multiple-${index}`] === letter}
                      onChange={() => onAnswer(`multiple-${index}`, letter)}
                    />
                    <span className="choice-letter">{letter}</span>
                    <span>{choice.replace(/^[A-D][.)]\s*/, '')}</span>
                    {correct && (
                      <span className="correct-label">
                        <Check size={14} />
                        Correct
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {revealed && (
              <p className="answer-feedback">
                {answers[`multiple-${index}`] === question.answer
                  ? 'You’ve got it.'
                  : answers[`multiple-${index}`]
                    ? `Your answer: ${answers[`multiple-${index}`]}. Correct answer: ${question.answer}.`
                    : `Not answered. Correct answer: ${question.answer}.`}
              </p>
            )}
          </fieldset>
        ))}
      </div>
      <div className="practice-category">
        <span className="section-kicker">ENUMERATION</span>
        {questions.enumeration.map((question, index) => (
          <article className="question-card" key={`enumeration-${index}`}>
            <h3>
              <span className="question-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              {question.question}
            </h3>
            <textarea aria-label={`Enumeration answer ${index + 1}`} rows={3} value={answers[`enumeration-${index}`] ?? ''} disabled={revealed || questionsBusy} onChange={(event) => onAnswer(`enumeration-${index}`, event.target.value)} placeholder="Write your answer..." />
            {revealed && <div className="answer-feedback"><strong>Expected answer</strong><ol>{question.answer.map((answer) => <li key={answer}>{answer}</li>)}</ol></div>}
          </article>
        ))}
      </div>
      <div className="practice-category">
        <span className="section-kicker">EXPLANATION</span>
        {questions.explanation.map((question, index) => (
          <article className="question-card" key={`explanation-${index}`}>
            <h3>
              <span className="question-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              {question.question}
            </h3>
            <textarea aria-label={`Explanation answer ${index + 1}`} rows={4} value={answers[`explanation-${index}`] ?? ''} disabled={revealed || questionsBusy} onChange={(event) => onAnswer(`explanation-${index}`, event.target.value)} placeholder="Write your explanation..." />
            {revealed && <p className="answer-feedback"><strong>Expected answer</strong><br />{question.answer}</p>}
          </article>
        ))}
      </div>
      <div className="practice-footer">
        {revealed ? (
          <>
            <p role="status">
              <strong>
                {score} of {questions.multiple_choice.length}
              </strong>{' '}
              multiple-choice answers correct.
            </p>
            <button className="button secondary" onClick={onRetry}>
              Try again
            </button>
          </>
        ) : (
          <>
            <span>{Object.keys(answers).length} of {questions.multiple_choice.length} answered</span>
            <button
              className="button primary"
              disabled={questionsBusy}
              onClick={onReveal}
            >
              Check answers
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
