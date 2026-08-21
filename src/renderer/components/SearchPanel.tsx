import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchHit } from '../../shared/types';
import type { FsApi } from '../fs-api';
import { formatBytes } from '../lib/format';

const MAX_HITS = 2000;
const DEBOUNCE_MS = 350;

let searchSeq = 0;

export function SearchPanel({
  fsApi,
  root,
  onOpenHit,
  onRevealHit,
  onClose,
}: {
  fsApi: FsApi;
  root: string;
  onOpenHit: (hit: SearchHit) => void;
  onRevealHit: (hit: SearchHit) => void;
  onClose: () => void;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [searchContent, setSearchContent] = useState(false);
  const [regex, setRegex] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [running, setRunning] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setRunning(false);
  }, []);

  // Cancel whatever is running when the panel closes or the folder changes —
  // a search of C:\ left running in the background is a real cost.
  useEffect(() => stop, [stop, root]);

  useEffect(() => {
    stop();
    setHits([]);
    setTruncated(false);
    if (query.trim().length < 2) return;

    const timer = setTimeout(() => {
      searchSeq += 1;
      const id = `s${searchSeq}`;
      // Hits arrive one at a time and a broad search produces thousands, so
      // batch them into a buffer flushed on an interval instead of calling
      // setState per hit.
      let buffer: SearchHit[] = [];
      const flush = () => {
        if (buffer.length === 0) return;
        const batch = buffer;
        buffer = [];
        setHits((prev) => (prev.length >= MAX_HITS ? prev : [...prev, ...batch]));
      };
      const ticker = setInterval(flush, 120);

      setRunning(true);
      const cancel = fsApi.search(
        {
          id,
          root,
          name: query.trim(),
          content: searchContent ? query.trim() : '',
          regex,
          caseSensitive: false,
          includeHidden: false,
          maxHits: MAX_HITS,
        },
        (hit) => buffer.push(hit),
        (wasTruncated) => {
          clearInterval(ticker);
          flush();
          setTruncated(wasTruncated);
          setRunning(false);
        },
      );

      cancelRef.current = () => {
        clearInterval(ticker);
        cancel();
      };
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, searchContent, regex, root, fsApi, stop]);

  return (
    <div className="search">
      <div className="search__bar">
        <input
          autoFocus
          spellCheck={false}
          value={query}
          placeholder={`Search in ${root}…`}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') onClose();
          }}
        />
        <button
          type="button"
          className={`search__toggle${searchContent ? ' search__toggle--on' : ''}`}
          title="Also search inside file contents"
          onClick={() => setSearchContent((v) => !v)}>
          Text
        </button>
        <button
          type="button"
          className={`search__toggle${regex ? ' search__toggle--on' : ''}`}
          title="Treat the query as a regular expression"
          onClick={() => setRegex((v) => !v)}>
          .*
        </button>
        <button type="button" className="search__toggle" onClick={onClose} title="Close (Esc)">
          ✕
        </button>
      </div>

      <div className="search__results">
        {hits.map((hit, i) => (
          <button
            key={`${hit.path}:${hit.lineNo ?? i}`}
            type="button"
            className="search__hit"
            onClick={() => onOpenHit(hit)}
            onDoubleClick={() => onRevealHit(hit)}
            title={hit.path}>
            <div className="search__hitname">
              {hit.name}
              {hit.kind === 'file' && (
                <span className="search__hitpath"> · {formatBytes(hit.size)}</span>
              )}
            </div>
            <div className="search__hitpath">{hit.dir}</div>
            {hit.line && (
              <div className="search__hitline">
                {hit.lineNo}: {hit.line.trim()}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="search__status">
        {query.trim().length < 2
          ? 'Type at least 2 characters'
          : running
            ? `Searching… ${hits.length} found`
            : `${hits.length} result${hits.length === 1 ? '' : 's'}${truncated ? ` (stopped at ${MAX_HITS})` : ''}`}
        {' · click to jump, double-click to reveal'}
      </div>
    </div>
  );
}
