import React, { useEffect, useRef, useState } from 'react';
import type { AssistantApi, AssistantContext } from '../assistant';
import { describeContext } from '../assistant';
import { Modal } from './ui';

const SUGGESTIONS = [
  'What is this folder for?',
  'Which of these look like duplicates?',
  'Suggest better names for the selected files',
  'What can I safely delete here?',
];

/**
 * Ask the assistant about the current folder or selection (handoff §2.2).
 *
 * The context block is shown collapsed-but-inspectable on purpose: it says
 * exactly what is about to leave the app. Paths and metadata go, file contents
 * never do — see describeContext.
 */
export function AskV({
  assistant,
  context,
  onClose,
}: {
  assistant: AssistantApi;
  context: AssistantContext;
  onClose: () => void;
}): React.JSX.Element {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [state, setState] = useState<'idle' | 'asking' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showContext, setShowContext] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const replyRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => cancelRef.current?.(), []);

  // Follow the stream as it arrives.
  useEffect(() => {
    const el = replyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [reply]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || state === 'asking') return;
    setReply('');
    setError('');
    setState('asking');
    cancelRef.current = assistant.ask(q, context, {
      onDelta: (chunk) => setReply((r) => r + chunk),
      onDone: () => setState('done'),
      onError: (message) => {
        setError(message);
        setState('error');
      },
    });
  };

  const busy = state === 'asking';

  return (
    <Modal
      title={`Ask ${assistant.name}`}
      wide
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={() => setShowContext((v) => !v)}
            title="Exactly what gets sent — paths and metadata only, never file contents">
            {showContext ? 'Hide context' : 'Show context'}
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || !prompt.trim()}
            onClick={() => ask(prompt)}>
            {busy ? 'Asking…' : 'Ask'}
          </button>
        </>
      }>
      <input
        className="modal__input"
        autoFocus
        spellCheck={false}
        placeholder={`Ask ${assistant.name} about ${context.selection.length || 'this'} ${
          context.selection.length === 1 ? 'item' : context.selection.length ? 'items' : 'folder'
        }…`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            ask(prompt);
          }
        }}
      />

      {state === 'idle' && (
        <div className="askv__chips">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="askv__chip"
              onClick={() => {
                setPrompt(s);
                ask(s);
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {showContext && <pre className="askv__context">{describeContext(context)}</pre>}

      {(reply || busy || error) && (
        <div className="askv__reply" ref={replyRef}>
          {error ? (
            <span className="askv__error">{error}</span>
          ) : (
            <>
              {reply}
              {busy && <span className="askv__caret">▋</span>}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
