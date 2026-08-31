import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HOME_PATH,
  type DirListing,
  type DriveInfo,
  type FsEntry,
  type GitStatus,
  type PaneLeaf,
  type Place,
  type Settings,
  type SortKey,
} from '../../shared/types';
import type { FsApi } from '../fs-api';
import { readDropPaths, useSpringLoad } from '../lib/dnd';
import { breadcrumbSegments } from '../lib/format';
import { parseFilter } from '../lib/filter';
import { sortEntries } from '../lib/sort';
import { FileList } from './FileList';
import { HomeView } from './HomeView';
import { SearchPanel } from './SearchPanel';
import { Icon } from './ui';

/**
 * Folder sizing is opt-in per row and genuinely expensive — a drive root with
 * 40 top-level folders would otherwise kick off 40 full-tree walks the instant
 * you land there. Cap how many rows we ask about; the rest show "—" until the
 * listing is small enough to be worth it.
 */
const SIZE_ROW_CAP = 150;

export interface FilePaneProps {
  leaf: PaneLeaf;
  active: boolean;
  /** True when the tab has more than one pane — drives the active-pane border. */
  multi: boolean;
  settings: Settings;
  fsApi: FsApi;
  selection: { paths: string[]; cursor: string | null };
  cutPaths: Set<string>;
  renaming: string | null;
  searchOpen: boolean;
  onActivate: () => void;
  onNavigate: (path: string) => void;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onSort: (key: SortKey) => void;
  onToggleView: () => void;
  onFilterChange: (text: string) => void;
  onSelectionChange: (paths: string[], cursor: string | null) => void;
  onListing: (paneId: string, listing: DirListing | null, entries: FsEntry[]) => void;
  onOpenFile: (entry: FsEntry) => void;
  onContextMenu: (e: React.MouseEvent, entry: FsEntry | null) => void;
  onDropPaths: (paths: string[], destDir: string, copy: boolean) => void;
  onRenameCommit: (path: string, newName: string) => void;
  onRenameCancel: () => void;
  onCloseSearch: () => void;
  /** Home tab data — the pane renders <HomeView/> instead of a listing. */
  known: Place[];
  drives: DriveInfo[];
  onOpenPath: (path: string) => void;
  onRevealPath: (path: string) => void;
  onClearRecent: () => void;
  /** Bumped to force a re-read (Ctrl+R / the refresh button). */
  refreshKey: number;
  onRefresh: () => void;
}

export function FilePane(props: FilePaneProps): React.JSX.Element {
  const {
    leaf, active, multi, settings, fsApi, selection, cutPaths, renaming, searchOpen,
    onActivate, onNavigate, onBack, onForward, onUp, onSort, onToggleView, onFilterChange,
    onSelectionChange, onListing, onOpenFile, onContextMenu, onDropPaths,
    onRenameCommit, onRenameCancel, onCloseSearch, refreshKey, onRefresh,
    known, drives, onOpenPath, onRevealPath, onClearRecent,
  } = props;

  /** Home is a virtual path: nothing below should try to read or watch it. */
  const isHome = leaf.path === HOME_PATH;

  const [listing, setListing] = useState<DirListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [git, setGit] = useState<GitStatus | null>(null);
  const [folderSizes, setFolderSizes] = useState<Record<string, number>>({});
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [crumbDrop, setCrumbDrop] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  // The breadcrumbs are the way back OUT mid-drag: hold over an ancestor to
  // walk up, then spring back down a different branch without ever letting go.
  const crumbSpring = useSpringLoad(onNavigate);

  /* ---- load the listing, and reload when the folder changes on disk ---- */

  const load = useCallback(
    async (path: string) => {
      const result = await fsApi.readDir(path);
      // A slow read for a folder we have since navigated away from must not
      // overwrite the current one.
      setListing((prev) => (prev && prev.path !== path && path !== leaf.path ? prev : result));
      setLoading(false);
      return result;
    },
    [fsApi, leaf.path],
  );

  useEffect(() => {
    if (isHome) {
      setListing(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFolderSizes({});
    setGit(null);

    void (async () => {
      const result = await fsApi.readDir(leaf.path);
      if (cancelled) return;
      setListing(result);
      setLoading(false);
    })();

    const stop = fsApi.watch(leaf.path, () => {
      if (!cancelled) void load(leaf.path);
    });

    return () => {
      cancelled = true;
      stop();
    };
    // refreshKey is a dependency on purpose: bumping it re-runs this effect,
    // which is exactly what Ctrl+R and the refresh button do.
  }, [fsApi, leaf.path, load, refreshKey, isHome]);

  /* ---- git badges arrive after the rows are already painted ---- */

  useEffect(() => {
    if (!settings.showGitStatus || !listing?.gitRoot) {
      setGit(null);
      return;
    }
    let cancelled = false;
    void fsApi.gitStatus(listing.path).then((s) => {
      if (!cancelled) setGit(s);
    });
    return () => {
      cancelled = true;
    };
  }, [fsApi, listing?.gitRoot, listing?.path, listing, settings.showGitStatus]);

  /* ---- background folder sizing ---- */

  useEffect(() => {
    if (!settings.showFolderSizes || !listing) return;
    const dirs = listing.entries.filter((e) => e.kind === 'dir');
    if (dirs.length === 0 || dirs.length > SIZE_ROW_CAP) return;

    let cancelled = false;
    for (const dir of dirs) {
      void fsApi.folderSize(dir.path).then((size) => {
        if (cancelled || !size) return;
        setFolderSizes((prev) => (prev[dir.path] === size ? prev : { ...prev, [dir.path]: size }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [fsApi, listing, settings.showFolderSizes]);

  /* ---- filter + sort ---- */

  const entries = useMemo(() => {
    if (!listing) return [];
    let rows = listing.entries;
    if (!settings.showHidden) rows = rows.filter((e) => !e.hidden);
    if (!settings.showSystem) rows = rows.filter((e) => !e.system);
    const predicate = parseFilter(leaf.filter);
    if (predicate) rows = rows.filter(predicate);
    return sortEntries(rows, leaf.sortKey, leaf.sortDir, settings.foldersFirst);
  }, [listing, leaf.filter, leaf.sortKey, leaf.sortDir, settings.showHidden, settings.showSystem, settings.foldersFirst]);

  // Keep the owner (status bar, preview, commander transfers) in sync.
  useEffect(() => {
    onListing(leaf.id, listing, entries);
  }, [onListing, leaf.id, listing, entries]);

  const selectionSet = useMemo(() => new Set(selection.paths), [selection.paths]);

  const segments = useMemo(() => breadcrumbSegments(leaf.path), [leaf.path]);

  const open = (entry: FsEntry) => {
    if (entry.kind === 'dir' || entry.kind === 'junction') onNavigate(entry.path);
    else onOpenFile(entry);
  };

  const commitPathEdit = async (value: string) => {
    setEditingPath(null);
    const resolved = await fsApi.resolvePath(value, leaf.path);
    if (resolved) onNavigate(resolved);
  };

  const hiddenCount = listing
    ? listing.entries.length - entries.length - (leaf.filter ? 0 : 0)
    : 0;

  return (
    <div
      className={`pane${active && multi ? ' pane--active-multi' : ''}`}
      onMouseDown={onActivate}>
      <div className="pane__bar">
        <button
          type="button"
          className={`navbtn${isHome ? ' navbtn--on' : ''}`}
          title="Home (Alt+Home)"
          onClick={() => onNavigate(HOME_PATH)}>
          <Icon name="star" />
        </button>
        <button
          type="button"
          className="navbtn"
          title="Back (Alt+Left)"
          disabled={leaf.historyIndex <= 0}
          onClick={onBack}>
          <Icon name="back" />
        </button>
        <button
          type="button"
          className="navbtn"
          title="Forward (Alt+Right)"
          disabled={leaf.historyIndex >= leaf.history.length - 1}
          onClick={onForward}>
          <Icon name="forward" />
        </button>
        <button type="button" className="navbtn" title="Up (Backspace)" onClick={onUp}>
          <Icon name="up" />
        </button>
        <button
          type="button"
          className="navbtn"
          title="Refresh (Ctrl+R)"
          onClick={onRefresh}>
          <Icon name="refresh" />
        </button>
        <button
          type="button"
          className="navbtn"
          title={leaf.viewMode === 'grid' ? 'Details view' : 'Grid view'}
          onClick={onToggleView}>
          <Icon name={leaf.viewMode === 'grid' ? 'split-v' : 'split-h'} />
        </button>

        {editingPath !== null ? (
          <input
            className="crumbs__edit"
            autoFocus
            spellCheck={false}
            defaultValue={editingPath}
            onBlur={(e) => void commitPathEdit(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') void commitPathEdit(e.currentTarget.value);
              else if (e.key === 'Escape') setEditingPath(null);
            }}
          />
        ) : (
          <div
            className="crumbs"
            title="Click a segment to jump — click the empty space to type a path"
            onDoubleClick={() => setEditingPath(leaf.path)}>
            <div className="crumbs__scroll">
              <div className="crumbs__inner">
                {segments.map((seg, i) => (
                  <React.Fragment key={seg.path}>
                    {i > 0 && <span className="crumb__sep">›</span>}
                    <button
                      type="button"
                      className={[
                        'crumb',
                        i === segments.length - 1 ? 'crumb--last' : '',
                        crumbDrop === seg.path ? 'crumb--drop' : '',
                        crumbSpring.path === seg.path ? 'is-springing' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onNavigate(seg.path)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
                        setCrumbDrop(seg.path);
                        crumbSpring.hover(seg.path);
                      }}
                      onDragLeave={() => setCrumbDrop((t) => (t === seg.path ? null : t))}
                      onDrop={(e) => {
                        e.preventDefault();
                        setCrumbDrop(null);
                        const paths = readDropPaths(e);
                        if (paths.length) onDropPaths(paths, seg.path, e.ctrlKey);
                      }}>
                      {seg.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
            {git && (
              <span className="gitbranch" title={`${git.dirty} changed · ${git.root}`}>
                {git.branch || 'detached'}
                {git.dirty > 0 && <span className="gitbranch__dirty">●{git.dirty}</span>}
                {git.ahead > 0 && <span>↑{git.ahead}</span>}
                {git.behind > 0 && <span>↓{git.behind}</span>}
              </span>
            )}
          </div>
        )}
      </div>

      {!isHome && (leaf.filter !== '' || active) ? (
        <div className="filterbar">
          <span className="filterbar__icon">▸</span>
          <input
            ref={filterRef}
            data-pane-filter={leaf.id}
            value={leaf.filter}
            spellCheck={false}
            placeholder="Filter — ext:png  size:>10mb  mod:today  -draft"
            onChange={(e) => onFilterChange(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                onFilterChange('');
                e.currentTarget.blur();
              }
            }}
          />
          <span className="filterbar__count">
            {entries.length}
            {listing && entries.length !== listing.entries.length && ` / ${listing.entries.length}`}
          </span>
        </div>
      ) : null}

      {isHome ? (
        <HomeView
          fsApi={fsApi}
          pinned={settings.pinned}
          known={known}
          drives={drives}
          recentFiles={settings.recentFiles}
          onNavigate={onNavigate}
          onOpenFile={onOpenPath}
          onRevealFile={onRevealPath}
          onClearRecent={onClearRecent}
        />
      ) : searchOpen ? (
        <SearchPanel
          fsApi={fsApi}
          root={leaf.path}
          onOpenHit={(hit) => onNavigate(hit.dir)}
          onRevealHit={(hit) => void fsApi.revealInExplorer(hit.path)}
          onClose={onCloseSearch}
        />
      ) : (
        <FileList
          entries={entries}
          listing={listing}
          loading={loading}
          currentPath={leaf.path}
          fsApi={fsApi}
          selection={selectionSet}
          cursor={selection.cursor}
          sortKey={leaf.sortKey}
          sortDir={leaf.sortDir}
          viewMode={leaf.viewMode}
          gitEntries={git?.entries ?? null}
          folderSizes={folderSizes}
          showFolderSizes={settings.showFolderSizes}
          cutPaths={cutPaths}
          renaming={renaming}
          autoFocus={active}
          onSelectionChange={onSelectionChange}
          onOpen={open}
          onSort={onSort}
          onContextMenu={onContextMenu}
          onDropPaths={onDropPaths}
          onRenameCommit={onRenameCommit}
          onRenameCancel={onRenameCancel}
          onFocus={onActivate}
        />
      )}

      {listing?.warning && (
        <div className="search__status" title={listing.warning}>
          {listing.warning}
          {hiddenCount > 0 && !settings.showHidden ? ' · hidden items filtered' : ''}
        </div>
      )}
    </div>
  );
}
