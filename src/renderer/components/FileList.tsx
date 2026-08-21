import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DirListing, FsEntry, GitFileStatus, SortDir, SortKey } from '../../shared/types';
import { formatBytes, formatDate, formatKind } from '../lib/format';
import { Icon, iconForEntry } from './ui';

const ROW_H = 26;
const OVERSCAN = 8;

export interface FileListProps {
  entries: FsEntry[];
  listing: DirListing | null;
  loading: boolean;
  currentPath: string;
  selection: Set<string>;
  cursor: string | null;
  sortKey: SortKey;
  sortDir: SortDir;
  gitEntries: Record<string, GitFileStatus> | null;
  folderSizes: Record<string, number>;
  showFolderSizes: boolean;
  cutPaths: Set<string>;
  renaming: string | null;
  /** Take keyboard focus on mount — set for the active pane. */
  autoFocus: boolean;
  onSelectionChange: (paths: string[], cursor: string | null) => void;
  onOpen: (entry: FsEntry) => void;
  onSort: (key: SortKey) => void;
  onContextMenu: (e: React.MouseEvent, entry: FsEntry | null) => void;
  onDropPaths: (paths: string[], destDir: string, copy: boolean) => void;
  onRenameCommit: (path: string, newName: string) => void;
  onRenameCancel: () => void;
  onFocus: () => void;
  /** Bubbled up so the pane can own shortcuts that aren't list navigation. */
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'name', label: 'Name', className: 'row__name' },
  { key: 'size', label: 'Size', className: 'col-size' },
  { key: 'modified', label: 'Modified', className: 'col-modified' },
  { key: 'kind', label: 'Type', className: 'col-kind' },
];

export function FileList(props: FileListProps): React.JSX.Element {
  const {
    entries, listing, loading, currentPath, selection, cursor, sortKey, sortDir,
    gitEntries, folderSizes, showFolderSizes, cutPaths, renaming, autoFocus,
    onSelectionChange, onOpen, onSort, onContextMenu, onDropPaths,
    onRenameCommit, onRenameCancel, onFocus, onKeyDown,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(600);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  /** Anchor for shift-click ranges — the last row selected without shift. */
  const anchorRef = useRef<string | null>(null);

  // Track the viewport so the virtual window knows how many rows to draw.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    setViewportH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  // A new folder starts at the top; keeping the old offset would land the user
  // in the middle of an unrelated listing.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [currentPath]);

  // Without this, a freshly launched (or freshly split) window has focus on
  // nothing, and arrow keys do nothing until the user clicks a row first.
  useEffect(() => {
    if (autoFocus) scrollRef.current?.focus({ preventScroll: true });
    // Mount only: re-focusing whenever `active` flips would yank the caret out
    // of the filter box the moment you clicked into it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const first = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const last = Math.min(entries.length, Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN);
  const visible = entries.slice(first, last);

  /** Largest folder in this listing — the denominator for the size heat bars. */
  const maxFolderSize = useMemo(() => {
    if (!showFolderSizes) return 0;
    let max = 0;
    for (const e of entries) {
      if (e.kind !== 'dir') continue;
      const s = folderSizes[e.path];
      if (s && s > max) max = s;
    }
    return max;
  }, [entries, folderSizes, showFolderSizes]);

  const scrollTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const top = index * ROW_H;
    if (top < el.scrollTop) el.scrollTo({ top });
    else if (top + ROW_H > el.scrollTop + el.clientHeight) {
      el.scrollTo({ top: top + ROW_H - el.clientHeight });
    }
  }, []);

  /* ---- selection ---- */

  const selectRange = useCallback(
    (fromPath: string | null, toIndex: number) => {
      const fromIndex = fromPath ? entries.findIndex((e) => e.path === fromPath) : -1;
      const start = Math.min(fromIndex === -1 ? toIndex : fromIndex, toIndex);
      const end = Math.max(fromIndex === -1 ? toIndex : fromIndex, toIndex);
      onSelectionChange(
        entries.slice(start, end + 1).map((e) => e.path),
        entries[toIndex]?.path ?? null,
      );
    },
    [entries, onSelectionChange],
  );

  const handleRowMouseDown = (e: React.MouseEvent, entry: FsEntry, index: number) => {
    onFocus();
    if (e.button === 2) {
      // Right-click on an unselected row selects it first, so the menu always
      // acts on something visible.
      if (!selection.has(entry.path)) {
        anchorRef.current = entry.path;
        onSelectionChange([entry.path], entry.path);
      }
      return;
    }
    if (e.shiftKey) {
      selectRange(anchorRef.current, index);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selection);
      if (next.has(entry.path)) next.delete(entry.path);
      else next.add(entry.path);
      anchorRef.current = entry.path;
      onSelectionChange([...next], entry.path);
      return;
    }
    // Plain click on an already-multi-selected row must not collapse the
    // selection on mousedown — that would break dragging a group.
    if (selection.has(entry.path) && selection.size > 1) return;
    anchorRef.current = entry.path;
    onSelectionChange([entry.path], entry.path);
  };

  const handleRowMouseUp = (e: React.MouseEvent, entry: FsEntry) => {
    if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (selection.has(entry.path) && selection.size > 1) {
      anchorRef.current = entry.path;
      onSelectionChange([entry.path], entry.path);
    }
  };

  /* ---- keyboard ---- */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const index = cursor ? entries.findIndex((x) => x.path === cursor) : -1;
    const move = (delta: number) => {
      if (entries.length === 0) return;
      const next = Math.min(entries.length - 1, Math.max(0, (index === -1 ? 0 : index) + delta));
      e.preventDefault();
      if (e.shiftKey) selectRange(anchorRef.current ?? cursor, next);
      else {
        anchorRef.current = entries[next].path;
        onSelectionChange([entries[next].path], entries[next].path);
      }
      scrollTo(next);
    };

    switch (e.key) {
      case 'ArrowDown':
        return move(1);
      case 'ArrowUp':
        return move(-1);
      case 'PageDown':
        return move(Math.max(1, Math.floor(viewportH / ROW_H) - 1));
      case 'PageUp':
        return move(-Math.max(1, Math.floor(viewportH / ROW_H) - 1));
      case 'Home':
        return move(-entries.length);
      case 'End':
        return move(entries.length);
      case 'Enter': {
        if (index >= 0) {
          e.preventDefault();
          onOpen(entries[index]);
        }
        return;
      }
      case 'a':
      case 'A':
        if (e.ctrlKey) {
          e.preventDefault();
          onSelectionChange(entries.map((x) => x.path), cursor);
          return;
        }
        break;
      default:
        break;
    }
    onKeyDown?.(e);
  };

  /* ---- drag & drop ---- */

  const dragPaths = useCallback(
    (entry: FsEntry): string[] =>
      selection.has(entry.path) ? [...selection] : [entry.path],
    [selection],
  );

  const handleDragStart = (e: React.DragEvent, entry: FsEntry) => {
    const paths = dragPaths(entry);
    if (e.altKey) {
      // Alt starts an OS-level drag so files can be dropped into other apps.
      // Electron's startDrag takes over the pointer, which is exactly why it
      // cannot be the default: it would kill dragging between Onyx's own panes.
      e.preventDefault();
      window.onyx.startDrag(paths);
      return;
    }
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('application/x-onyx-paths', JSON.stringify(paths));
    e.dataTransfer.setData('text/plain', paths.join('\r\n'));
  };

  /** Read dropped paths from either an internal drag or a drop from Explorer. */
  const readDropPaths = (e: React.DragEvent): string[] => {
    const internal = e.dataTransfer.getData('application/x-onyx-paths');
    if (internal) {
      try {
        return JSON.parse(internal) as string[];
      } catch {
        return [];
      }
    }
    // File.path was removed in Electron 32+; webUtils (via the preload) is the
    // only supported way to recover a dropped file's real path.
    return [...e.dataTransfer.files].map((f) => window.onyx.getPathForFile(f)).filter(Boolean);
  };

  const handleDrop = (e: React.DragEvent, destDir: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const paths = readDropPaths(e);
    if (paths.length) onDropPaths(paths, destDir, e.ctrlKey);
  };

  const allowDrop = (e: React.DragEvent, target: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
    setDropTarget(target);
  };

  /* ---- render ---- */

  if (loading && entries.length === 0) {
    return <div className="list__empty">Reading…</div>;
  }

  return (
    <div className="list">
      <div className="list__head">
        <span className="row__icon" />
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            type="button"
            className={col.className}
            style={col.key === 'name' ? undefined : { justifyContent: 'flex-end' }}
            onClick={() => onSort(col.key)}>
            <span>{col.label}</span>
            {sortKey === col.key && (
              <span className="list__sortmark">{sortDir === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="list__scroll"
        tabIndex={0}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onMouseDown={(e) => {
          // A click on empty space clears the selection.
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('list__spacer')) {
            onFocus();
            anchorRef.current = null;
            onSelectionChange([], null);
          }
        }}
        onContextMenu={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('list__spacer')) {
            onContextMenu(e, null);
          }
        }}
        onDragOver={(e) => allowDrop(e, null)}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(e) => handleDrop(e, currentPath)}>
        {listing?.error && <div className="list__empty list__error">{listing.error}</div>}

        {!listing?.error && entries.length === 0 && !loading && (
          <div className="list__empty">This folder is empty</div>
        )}

        <div className="list__spacer" style={{ height: entries.length * ROW_H }}>
          {visible.map((entry, i) => {
            const index = first + i;
            const isDir = entry.kind === 'dir' || entry.kind === 'junction';
            const git = gitEntries?.[entry.path];
            const size = isDir ? folderSizes[entry.path] : entry.size;
            const heat =
              isDir && showFolderSizes && maxFolderSize > 0 && size
                ? Math.max(2, Math.round((size / maxFolderSize) * 100))
                : 0;

            const classes = ['row'];
            if (index % 2 === 1) classes.push('row--alt');
            if (selection.has(entry.path)) classes.push('row--selected');
            if (cursor === entry.path) classes.push('row--cursor');
            if (cutPaths.has(entry.path)) classes.push('row--cut');
            if (entry.hidden) classes.push('row--hidden');
            if (entry.inaccessible) classes.push('row--inaccessible');
            if (git === 'ignored') classes.push('row--ignored');
            if (dropTarget === entry.path) classes.push('row--droptarget');

            return (
              <div
                key={entry.path}
                className={classes.join(' ')}
                style={{ top: index * ROW_H }}
                draggable
                onDragStart={(e) => handleDragStart(e, entry)}
                onDragOver={(e) => (isDir ? allowDrop(e, entry.path) : allowDrop(e, null))}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => handleDrop(e, isDir ? entry.path : currentPath)}
                onMouseDown={(e) => handleRowMouseDown(e, entry, index)}
                onMouseUp={(e) => handleRowMouseUp(e, entry)}
                onDoubleClick={() => onOpen(entry)}
                onContextMenu={(e) => onContextMenu(e, entry)}>
                <span className={`row__icon${isDir ? ' row__icon--dir' : ''}`}>
                  <Icon name={iconForEntry(entry.kind, entry.ext)} />
                </span>

                {git && git !== 'ignored' && <span className={`gitdot gitdot--${git}`} />}

                {renaming === entry.path ? (
                  <RenameInput
                    initial={entry.name}
                    onCommit={(name) => onRenameCommit(entry.path, name)}
                    onCancel={onRenameCancel}
                  />
                ) : (
                  <span className="row__name" title={entry.name}>
                    {entry.name}
                  </span>
                )}

                <span className="row__col col-size sizebar">
                  {isDir ? (size ? formatBytes(size) : '—') : formatBytes(entry.size)}
                  {heat > 0 && <span className="sizebar__fill" style={{ width: `${heat}%` }} />}
                </span>
                <span className="row__col col-modified">{formatDate(entry.modified)}</span>
                <span className="row__col col-kind">{formatKind(entry)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    if (dot > 0) el.setSelectionRange(0, dot);
    else el.select();
  }, [initial]);

  return (
    <input
      ref={ref}
      className="row__rename"
      value={value}
      spellCheck={false}
      onChange={(e) => setValue(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onBlur={() => (value.trim() && value !== initial ? onCommit(value) : onCancel())}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          if (value.trim() && value !== initial) onCommit(value);
          else onCancel();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
}
