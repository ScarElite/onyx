import type {
  ConflictPolicy,
  DirListing,
  DriveInfo,
  FsEvent,
  GitStatus,
  OpProgress,
  OpResult,
  Place,
  PreviewPayload,
  SearchHit,
  SearchQuery,
} from '../shared/types';

/**
 * The host-agnostic filesystem contract the explorer UI codes against.
 *
 * This is the boundary that lets Onyx live in two places at once, exactly the
 * way Conduit's `PtyApi` does for its <Terminal/>: `Explorer.tsx` imports this
 * interface and nothing else — no `electron`, no `window.onyx`, no `fs`. The
 * standalone app injects `createBridgeFsApi()` below; V's Command Hub injects an
 * implementation backed by its own main process. Same contract, no rewrite.
 *
 * Note the shape difference from `OnyxBridge`: subscriptions here are
 * callback-in / unsubscribe-out and scoped to a single path, because that is
 * what component code actually wants. The plumbing that turns one global IPC
 * event stream into per-path subscriptions lives in the adapter, not the UI.
 */
export interface FsApi {
  // --- reading ---
  readDir(path: string): Promise<DirListing>;
  drives(): Promise<DriveInfo[]>;
  homeDir(): Promise<string>;
  knownFolders(): Promise<Place[]>;
  resolvePath(input: string, base: string): Promise<string | null>;
  parentOf(path: string): Promise<string | null>;

  /** Watch one directory. Returns an unsubscribe function. */
  watch(path: string, cb: (ev: FsEvent) => void): () => void;

  // --- mutating ---
  open(path: string): Promise<OpResult>;
  revealInExplorer(path: string): Promise<OpResult>;
  openTerminalAt(path: string): Promise<OpResult>;
  copy(srcs: string[], destDir: string, policy: ConflictPolicy): Promise<OpResult>;
  move(srcs: string[], destDir: string, policy: ConflictPolicy): Promise<OpResult>;
  rename(path: string, newName: string): Promise<OpResult>;
  renameMany(pairs: { path: string; newName: string }[]): Promise<OpResult>;
  remove(paths: string[], toTrash: boolean): Promise<OpResult>;
  mkdir(parent: string, name: string): Promise<OpResult>;
  newFile(parent: string, name: string): Promise<OpResult>;
  undo(): Promise<OpResult>;
  undoLabel(): Promise<string | null>;
  onOpProgress(cb: (p: OpProgress) => void): () => void;

  // --- clipboard ---
  clipboardCopyPaths(paths: string[]): Promise<OpResult>;
  clipboardCutPaths(paths: string[]): Promise<OpResult>;
  clipboardReadPaths(): Promise<{ paths: string[]; cut: boolean }>;
  copyText(text: string): void;

  // --- analysis ---
  preview(path: string): Promise<PreviewPayload>;
  folderSize(path: string): Promise<number>;
  gitStatus(dir: string): Promise<GitStatus | null>;
  /** Start a search; hits stream to `onHit`. Returns a cancel function. */
  search(q: SearchQuery, onHit: (hit: SearchHit) => void, onDone: (truncated: boolean) => void): () => void;

  // --- drag & drop ---
  getPathForFile(file: File): string;
  startDrag(paths: string[]): void;

  pickFolder(): Promise<string | null>;
}

/**
 * FsApi over the Electron preload bridge (`window.onyx`) — the standalone app's
 * implementation. Everything here is adaptation, never logic: fan the single
 * `fs:event` stream out to per-directory subscribers, and turn the fire-and-
 * forget search channel into a cancellable call.
 */
export function createBridgeFsApi(): FsApi {
  const onyx = window.onyx;

  // One IPC listener for the whole app; subscribers are indexed by directory so
  // a burst of events doesn't wake every pane.
  const watchers = new Map<string, Set<(ev: FsEvent) => void>>();
  onyx.onFsEvent((ev) => {
    const subs = watchers.get(ev.dir.toLowerCase());
    if (subs) for (const cb of subs) cb(ev);
  });

  const searchHandlers = new Map<
    string,
    { onHit: (h: SearchHit) => void; onDone: (t: boolean) => void }
  >();
  onyx.onSearchHit((id, hit) => searchHandlers.get(id)?.onHit(hit));
  onyx.onSearchDone((id, truncated) => {
    searchHandlers.get(id)?.onDone(truncated);
    searchHandlers.delete(id);
  });

  return {
    readDir: (p) => onyx.readDir(p),
    drives: () => onyx.drives(),
    homeDir: () => onyx.homeDir(),
    knownFolders: () => onyx.knownFolders(),
    resolvePath: (input, base) => onyx.resolvePath(input, base),
    parentOf: (p) => onyx.parentOf(p),

    watch(dir, cb) {
      const key = dir.toLowerCase();
      let set = watchers.get(key);
      if (!set) {
        set = new Set();
        watchers.set(key, set);
      }
      set.add(cb);
      onyx.watch(dir);
      return () => {
        set?.delete(cb);
        if (set && set.size === 0) watchers.delete(key);
        onyx.unwatch(dir);
      };
    },

    open: (p) => onyx.open(p),
    revealInExplorer: (p) => onyx.revealInExplorer(p),
    openTerminalAt: (p) => onyx.openTerminalAt(p),
    copy: (s, d, policy) => onyx.copy(s, d, policy),
    move: (s, d, policy) => onyx.move(s, d, policy),
    rename: (p, n) => onyx.rename(p, n),
    renameMany: (pairs) => onyx.renameMany(pairs),
    remove: (paths, toTrash) => onyx.remove(paths, toTrash),
    mkdir: (parent, name) => onyx.mkdir(parent, name),
    newFile: (parent, name) => onyx.newFile(parent, name),
    undo: () => onyx.undo(),
    undoLabel: () => onyx.undoLabel(),
    onOpProgress: (cb) => onyx.onOpProgress(cb),

    clipboardCopyPaths: (paths) => onyx.clipboardCopyPaths(paths),
    clipboardCutPaths: (paths) => onyx.clipboardCutPaths(paths),
    clipboardReadPaths: () => onyx.clipboardReadPaths(),
    copyText: (t) => onyx.copyText(t),

    preview: (p) => onyx.preview(p),
    folderSize: (p) => onyx.folderSize(p),
    gitStatus: (d) => onyx.gitStatus(d),

    search(q, onHit, onDone) {
      searchHandlers.set(q.id, { onHit, onDone });
      onyx.search(q);
      return () => {
        onyx.cancelSearch(q.id);
        searchHandlers.delete(q.id);
      };
    },

    getPathForFile: (f) => onyx.getPathForFile(f),
    startDrag: (paths) => onyx.startDrag(paths),
    pickFolder: () => onyx.pickFolder(),
  };
}
