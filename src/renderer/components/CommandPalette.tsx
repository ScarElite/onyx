import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fuzzyRank, type FuzzyMatch } from '../lib/fuzzy';

export interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

/** Render a label with the fuzzy-matched characters highlighted. */
function Highlight({ text, positions }: { text: string; positions: number[] }): React.JSX.Element {
  if (positions.length === 0) return <>{text}</>;
  const set = new Set(positions);
  return (
    <>
      {[...text].map((ch, i) =>
        set.has(i) ? (
          <span key={i} className="palette__match">
            {ch}
          </span>
        ) : (
          <React.Fragment key={i}>{ch}</React.Fragment>
        ),
      )}
    </>
  );
}

export function CommandPalette({
  placeholder,
  items,
  resolveExtra,
  onClose,
}: {
  placeholder: string;
  items: PaletteItem[];
  /**
   * Async source for items that only exist once the user has typed — the path
   * palette uses it to offer a literally-typed path that isn't in the list.
   */
  resolveExtra?: (query: string) => Promise<PaletteItem[]>;
  onClose: () => void;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [extra, setExtra] = useState<PaletteItem[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Escape is also handled on the input, but only that element sees it there.
  // Once focus moves — a click on a row, a re-render, anything — the palette
  // would become undismissable by keyboard without this window-level handler.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  useEffect(() => {
    if (!resolveExtra) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void resolveExtra(query).then((found) => {
        if (!cancelled) setExtra(found);
      });
    }, 140);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, resolveExtra]);

  const ranked = useMemo(() => {
    const ranked = fuzzyRank(query, items, (i) => i.label, 60);
    // Resolved extras are exact by construction, so they lead.
    return [
      ...extra.map((item) => ({ item, match: { score: Infinity, positions: [] } as FuzzyMatch })),
      ...ranked,
    ];
  }, [query, items, extra]);

  useEffect(() => setActive(0), [query, extra]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector('.palette__item--active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (index: number) => {
    const entry = ranked[index];
    if (!entry) return;
    onClose();
    entry.item.run();
  };

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          className="palette__input"
          autoFocus
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault();
                setActive((i) => Math.min(ranked.length - 1, i + 1));
                break;
              case 'ArrowUp':
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
                break;
              case 'Enter':
                e.preventDefault();
                run(active);
                break;
              case 'Escape':
                e.preventDefault();
                onClose();
                break;
              default:
                break;
            }
          }}
        />
        <div className="palette__list" ref={listRef}>
          {ranked.length === 0 ? (
            <div className="palette__empty">No matches</div>
          ) : (
            ranked.map((entry, i) => (
              <button
                key={entry.item.id}
                type="button"
                className={`palette__item${i === active ? ' palette__item--active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(i)}>
                <span className="palette__label">
                  <Highlight text={entry.item.label} positions={entry.match.positions} />
                </span>
                {entry.item.hint && <span className="palette__hint">{entry.item.hint}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
