import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ================================================================== *
 * Icons — inline SVG, sized by font, colored by currentColor.
 * ================================================================== */

export type IconName =
  | 'folder' | 'folder-link' | 'file' | 'image' | 'code' | 'text' | 'archive'
  | 'video' | 'audio' | 'pdf' | 'link' | 'drive' | 'star'
  | 'back' | 'forward' | 'up' | 'refresh' | 'split-h' | 'split-v'
  | 'close' | 'minimize' | 'maximize' | 'restore' | 'search' | 'settings'
  | 'plus' | 'terminal' | 'chevron-right' | 'eye';

const PATHS: Record<IconName, string> = {
  folder: 'M1.5 3.5h4l1.5 2h7.5v8h-13z',
  'folder-link': 'M1.5 3.5h4l1.5 2h7.5v8h-13z M6 9.5h4 M8.5 8l1.5 1.5-1.5 1.5',
  file: 'M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3',
  image: 'M2 3h12v10H2z M4.5 7.5a1 1 0 100-2 1 1 0 000 2z M2 11l3.5-3 3 2.5L11 8l3 3',
  code: 'M5.5 5L2.5 8l3 3 M10.5 5l3 3-3 3 M9.5 3.5l-3 9',
  text: 'M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3 M5.5 8h5 M5.5 10.5h5',
  archive: 'M2 3h12v3H2z M3 6v8h10V6 M7 8.5h2',
  video: 'M2 4h9v8H2z M11 7l3-2v6l-3-2z',
  audio: 'M6 10V3l6-1.5v7 M6 12a2 2 0 11-4 0 2 2 0 014 0z M14 10.5a2 2 0 11-4 0 2 2 0 014 0z',
  pdf: 'M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3 M5.5 9.5h1.5a1 1 0 000-2H5.5v4',
  link: 'M6.5 9.5a3 3 0 004.2 0l2.1-2.1a3 3 0 10-4.2-4.2L7.5 4.3 M9.5 6.5a3 3 0 00-4.2 0L3.2 8.6a3 3 0 104.2 4.2l1.1-1.1',
  drive: 'M2 8h12v5H2z M3.5 8V3.5h9V8 M4.5 10.5h2',
  star: 'M8 1.8l1.9 4 4.3.6-3.1 3 .7 4.3L8 11.7l-3.8 2 .7-4.3-3.1-3 4.3-.6z',
  back: 'M10 3.5L5.5 8l4.5 4.5',
  forward: 'M6 3.5L10.5 8 6 12.5',
  up: 'M3.5 10L8 5.5l4.5 4.5',
  refresh: 'M13 8a5 5 0 11-1.6-3.7 M13 2v3h-3',
  'split-h': 'M2 3h12v10H2z M8 3v10',
  'split-v': 'M2 3h12v10H2z M2 8h12',
  close: 'M4 4l8 8 M12 4l-8 8',
  minimize: 'M3.5 8h9',
  maximize: 'M3.5 3.5h9v9h-9z',
  restore: 'M5.5 5.5V3.5h7v7h-2 M3.5 5.5h7v7h-7z',
  search: 'M11.5 11.5L14 14 M12.5 7a5 5 0 11-10 0 5 5 0 0110 0z',
  settings:
    'M8 10a2 2 0 100-4 2 2 0 000 4z M8 1.5v2 M8 12.5v2 M1.5 8h2 M12.5 8h2 M3.4 3.4l1.4 1.4 M11.2 11.2l1.4 1.4 M12.6 3.4l-1.4 1.4 M4.8 11.2l-1.4 1.4',
  plus: 'M8 3.5v9 M3.5 8h9',
  terminal: 'M2 3h12v10H2z M4.5 6l2 2-2 2 M8.5 10.5h3',
  'chevron-right': 'M6.5 4.5L10 8l-3.5 3.5',
  eye: 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z M9.75 8a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0z',
};

export function Icon({ name, size = 14 }: { name: IconName; size?: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false">
      {PATHS[name].split(' M').map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}

/** Pick the glyph for a row from its kind + extension. */
const EXT_ICON: Record<string, IconName> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  bmp: 'image', svg: 'image', ico: 'image', avif: 'image',
  mp4: 'video', webm: 'video', mkv: 'video', mov: 'video', avi: 'video', m4v: 'video',
  mp3: 'audio', wav: 'audio', flac: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', xz: 'archive',
  pdf: 'pdf',
  ts: 'code', tsx: 'code', js: 'code', jsx: 'code', json: 'code', py: 'code',
  rs: 'code', go: 'code', java: 'code', c: 'code', cpp: 'code', cs: 'code',
  rb: 'code', php: 'code', sh: 'code', ps1: 'code', html: 'code', css: 'code',
  yml: 'code', yaml: 'code', toml: 'code', xml: 'code', sql: 'code',
  txt: 'text', md: 'text', log: 'text', csv: 'text', ini: 'text', cfg: 'text',
};

export function iconForEntry(kind: string, ext: string): IconName {
  if (kind === 'dir') return 'folder';
  if (kind === 'junction') return 'folder-link';
  if (kind === 'symlink') return 'link';
  return EXT_ICON[ext] ?? 'file';
}

/* ================================================================== *
 * Context menu
 * ================================================================== */

export interface MenuItem {
  label: string;
  onClick?: () => void;
  accel?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Flip the menu back inside the window when it would open off the edge.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: x + r.width > window.innerWidth ? Math.max(0, window.innerWidth - r.width - 4) : x,
      y: y + r.height > window.innerHeight ? Math.max(0, window.innerHeight - r.height - 4) : y,
    });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // `capture` so a click anywhere dismisses before it activates something else.
    window.addEventListener('mousedown', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="ctxmenu"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}>
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="ctxmenu__sep" />
        ) : (
          <button
            key={i}
            type="button"
            className={`ctxmenu__item${item.danger ? ' ctxmenu__item--danger' : ''}`}
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onClick?.();
            }}>
            <span>{item.label}</span>
            {item.accel && <span className="ctxmenu__key">{item.accel}</span>}
          </button>
        ),
      )}
    </div>
  );
}

/* ================================================================== *
 * Modal shell
 * ================================================================== */

export function Modal({
  title,
  children,
  footer,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className={`modal${wide ? ' settings' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}>
        <div className="modal__title">{title}</div>
        <div className="modal__body">{children}</div>
        <div className="modal__foot">{footer}</div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Promise-based dialogs
 * ================================================================== */

interface AskRequest {
  kind: 'ask';
  title: string;
  label?: string;
  initial: string;
  confirmLabel: string;
  /** Return an error string to block submission, or null when valid. */
  validate?: (value: string) => string | null;
  /** Select only the filename stem, the way rename should behave. */
  selectStem?: boolean;
}

interface ConfirmRequest {
  kind: 'confirm';
  title: string;
  message: string;
  items?: string[];
  confirmLabel: string;
  danger?: boolean;
}

export interface Choice {
  id: string;
  label: string;
  primary?: boolean;
  danger?: boolean;
  /** Shown under the label — say what the choice actually does to the files. */
  hint?: string;
}

interface ChooseRequest {
  kind: 'choose';
  title: string;
  message: string;
  items?: string[];
  choices: Choice[];
}

type Request = (AskRequest | ConfirmRequest | ChooseRequest) & { resolve: (v: never) => void };

/**
 * `const { ask, confirm, node } = useDialogs()` — await a modal instead of
 * threading dialog state through half a dozen components. Render `node` once.
 */
export function useDialogs(): {
  ask: (req: Omit<AskRequest, 'kind'>) => Promise<string | null>;
  confirm: (req: Omit<ConfirmRequest, 'kind'>) => Promise<boolean>;
  /** Resolves to the chosen `Choice.id`, or null if dismissed. */
  choose: (req: Omit<ChooseRequest, 'kind'>) => Promise<string | null>;
  node: React.ReactNode;
} {
  const [request, setRequest] = useState<Request | null>(null);

  const ask = useCallback(
    (req: Omit<AskRequest, 'kind'>) =>
      new Promise<string | null>((resolve) => {
        setRequest({ ...req, kind: 'ask', resolve: resolve as (v: never) => void });
      }),
    [],
  );

  const confirm = useCallback(
    (req: Omit<ConfirmRequest, 'kind'>) =>
      new Promise<boolean>((resolve) => {
        setRequest({ ...req, kind: 'confirm', resolve: resolve as (v: never) => void });
      }),
    [],
  );

  const choose = useCallback(
    (req: Omit<ChooseRequest, 'kind'>) =>
      new Promise<string | null>((resolve) => {
        setRequest({ ...req, kind: 'choose', resolve: resolve as (v: never) => void });
      }),
    [],
  );

  const finish = useCallback(
    (value: string | boolean | null) => {
      request?.resolve(value as never);
      setRequest(null);
    },
    [request],
  );

  let node: React.ReactNode = null;
  if (request?.kind === 'ask') {
    node = <AskDialog key="ask" req={request} onDone={(v) => finish(v)} />;
  } else if (request?.kind === 'confirm') {
    node = (
      <Modal
        title={request.title}
        onClose={() => finish(false)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => finish(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${request.danger ? 'btn--danger' : 'btn--primary'}`}
              onClick={() => finish(true)}
              autoFocus>
              {request.confirmLabel}
            </button>
          </>
        }>
        <p className="modal__message">{request.message}</p>
        {request.items && request.items.length > 0 && (
          <ul className="modal__list">
            {request.items.slice(0, 40).map((it) => (
              <li key={it}>{it}</li>
            ))}
            {request.items.length > 40 && <li>…and {request.items.length - 40} more</li>}
          </ul>
        )}
      </Modal>
    );
  }

  if (request?.kind === 'choose') {
    node = (
      <Modal
        title={request.title}
        onClose={() => finish(null)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => finish(null)}>
              Cancel
            </button>
            {request.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`btn${c.primary ? ' btn--primary' : ''}${c.danger ? ' btn--danger' : ''}`}
                title={c.hint}
                onClick={() => finish(c.id)}>
                {c.label}
              </button>
            ))}
          </>
        }>
        <p className="modal__message">{request.message}</p>
        {request.items && request.items.length > 0 && (
          <ul className="modal__list">
            {request.items.slice(0, 40).map((it) => (
              <li key={it}>{it}</li>
            ))}
            {request.items.length > 40 && <li>…and {request.items.length - 40} more</li>}
          </ul>
        )}
        <dl className="preview__meta" style={{ border: 'none', padding: 0 }}>
          {request.choices
            .filter((c) => c.hint)
            .map((c) => (
              <React.Fragment key={c.id}>
                <dt>{c.label}</dt>
                <dd>{c.hint}</dd>
              </React.Fragment>
            ))}
        </dl>
      </Modal>
    );
  }

  return { ask, confirm, choose, node };
}

function AskDialog({
  req,
  onDone,
}: {
  req: AskRequest;
  onDone: (value: string | null) => void;
}): React.JSX.Element {
  const [value, setValue] = useState(req.initial);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    // Renaming "report.final.txt" should preselect "report.final", not the
    // extension — retyping ".txt" every time is the classic rename annoyance.
    const dot = req.selectStem ? req.initial.lastIndexOf('.') : -1;
    if (dot > 0) el.setSelectionRange(0, dot);
    else el.select();
  }, [req.initial, req.selectStem]);

  const submit = () => {
    const err = req.validate?.(value) ?? null;
    if (err) {
      setError(err);
      return;
    }
    onDone(value);
  };

  return (
    <Modal
      title={req.title}
      onClose={() => onDone(null)}
      footer={
        <>
          <button type="button" className="btn" onClick={() => onDone(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={submit}>
            {req.confirmLabel}
          </button>
        </>
      }>
      {req.label && <p className="modal__message">{req.label}</p>}
      <input
        ref={inputRef}
        className="modal__input"
        value={value}
        spellCheck={false}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="modal__error">{error}</div>
    </Modal>
  );
}
