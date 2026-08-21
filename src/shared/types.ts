// Shared types used across the main, preload, and renderer processes.
// Keep this file dependency-free so it can be imported from any process.

/* ------------------------------------------------------------------ *
 * Filesystem
 * ------------------------------------------------------------------ */

export type EntryKind = 'dir' | 'file' | 'symlink' | 'junction' | 'unknown';

/**
 * One row in a listing. Deliberately flat and JSON-safe — it crosses IPC for
 * every entry in every directory, so no Dates, no methods, no nesting.
 */
export interface FsEntry {
  name: string;
  /** Absolute, normalized (path.win32) path. */
  path: string;
  kind: EntryKind;
  /** Bytes. Always 0 for directories — real sizes come from folderSize(). */
  size: number;
  /** Epoch ms. */
  modified: number;
  created: number;
  hidden: boolean;
  system: boolean;
  readonly: boolean;
  /**
   * The entry lives under a cloud-sync root (OneDrive), so its content may be a
   * placeholder: present in the listing but not on disk, where reading it
   * silently triggers a download. Content search skips these. See §9.6.
   *
   * NOT surfaced in the UI: without the real reparse tag (which needs a native
   * module) this is a path prefix test, so inside a synced tree it is true for
   * every file — a badge on all of them would carry no information.
   */
  placeholder: boolean;
  /** stat() failed (EPERM/EACCES, or a delete raced us). Render as dimmed. */
  inaccessible: boolean;
  /** Lowercase extension without the dot. '' for directories. */
  ext: string;
}

export interface DirListing {
  path: string;
  entries: FsEntry[];
  /** Non-fatal: the listing is usable but incomplete (some entries unreadable). */
  warning?: string;
  /** Fatal: nothing could be listed. `entries` is empty. */
  error?: string;
  /** Work-tree root, if this directory is inside a git repository. */
  gitRoot?: string;
}

export interface DriveInfo {
  /** 'C:' */
  letter: string;
  /** 'C:\' — what you actually navigate to. */
  path: string;
  label: string;
  /** Bytes. 0 when the drive isn't ready (empty card reader, ejected USB). */
  total: number;
  free: number;
  ready: boolean;
}

export type FsEventKind = 'add' | 'addDir' | 'unlink' | 'unlinkDir' | 'change';

export interface FsEvent {
  kind: FsEventKind;
  /** The directory being watched (the subscription key). */
  dir: string;
  /** The entry that changed. */
  path: string;
}

/* ------------------------------------------------------------------ *
 * Mutating operations
 * ------------------------------------------------------------------ */

export type OpKind = 'copy' | 'move' | 'rename' | 'trash' | 'delete' | 'mkdir' | 'newFile';

export interface OpResult {
  ok: boolean;
  /** Human-readable failure reason, shown in the status bar. */
  error?: string;
  /** Paths that were created/changed — the UI selects these afterwards. */
  affected?: string[];
  /** Per-item failures on a multi-item op that otherwise succeeded. */
  failures?: { path: string; error: string }[];
  /** Label of the operation now on top of the undo stack, if any. */
  undoLabel?: string;
}

/** What to do when a paste/move target already exists. */
export type ConflictPolicy = 'ask' | 'skip' | 'overwrite' | 'keepBoth';

export interface OpProgress {
  id: string;
  kind: OpKind;
  /** 0..1, or -1 when the total isn't known yet. */
  fraction: number;
  /** Current file being processed. */
  current: string;
  done: boolean;
}

/* ------------------------------------------------------------------ *
 * Preview
 * ------------------------------------------------------------------ */

export type PreviewKind = 'image' | 'text' | 'pdf' | 'video' | 'audio' | 'binary' | 'dir' | 'none';

export interface PreviewPayload {
  path: string;
  kind: PreviewKind;
  /** Images: a data: URL. Video/audio/pdf: a file: URL. */
  src?: string;
  /** Text: the first N KB, decoded UTF-8. */
  text?: string;
  /** Text: true when the file was longer than the read cap. */
  truncated?: boolean;
  /** Fenced-code language hint derived from the extension. */
  lang?: string;
  /** Directory previews: immediate child counts. */
  childCount?: { dirs: number; files: number };
  size: number;
  modified: number;
  error?: string;
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export interface SearchQuery {
  id: string;
  root: string;
  /** Substring (case-insensitive) or, when `regex`, a pattern. Matches names. */
  name: string;
  /** Optional content grep. Empty = name-only search (much faster). */
  content: string;
  regex: boolean;
  caseSensitive: boolean;
  includeHidden: boolean;
  /** Hard cap so a search of C:\ can't run forever. */
  maxHits: number;
}

export interface SearchHit {
  path: string;
  name: string;
  dir: string;
  kind: EntryKind;
  size: number;
  modified: number;
  /** Content matches only: the matching line and its 1-based number. */
  line?: string;
  lineNo?: number;
}

/* ------------------------------------------------------------------ *
 * Git
 * ------------------------------------------------------------------ */

export type GitFileStatus =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'untracked'
  | 'ignored'
  | 'conflicted';

export interface GitStatus {
  root: string;
  branch: string;
  ahead: number;
  behind: number;
  /** Count of changed (non-ignored) entries in the whole work tree. */
  dirty: number;
  /**
   * Absolute path -> status, for entries at or under the queried directory.
   * A directory carries the "worst" status of anything inside it, so a folder
   * row can show a badge without the UI walking the tree.
   */
  entries: Record<string, GitFileStatus>;
}

/* ------------------------------------------------------------------ *
 * Theming — the vlime family, shared with Conduit and V's Command Hub
 * ------------------------------------------------------------------ */

/**
 * Chrome CSS variables. Each key maps to a `--kebab-case` custom property set
 * on :root (see applyChrome in themes.ts).
 */
export interface ChromeTheme {
  chromeBg: string; //     --chrome-bg      window body / title bar background
  panelBg: string; //      --panel-bg       sidebar, settings, preview background
  rowBg: string; //        --row-bg         alternating list row tint
  border: string; //       --border         window + panel borders
  fg: string; //           --fg             primary text
  dimFg: string; //        --dim-fg         secondary text (size, date, counts)
  accent: string; //       --accent         HUD accent: focus, active tab, cursor
  selectionBg: string; //  --selection-bg   selected row background
  scrollbar: string; //    --scrollbar      scrollbar thumb
  /** Git badge colors — Onyx-specific, no Conduit equivalent. */
  gitModified: string; //  --git-modified
  gitAdded: string; //     --git-added
  gitUntracked: string; // --git-untracked
  gitDeleted: string; //   --git-deleted
}

export interface FontSettings {
  family: string;
  size: number;
}

/** A theme is just data: a complete, named color + font set. */
export interface Theme {
  name: string;
  chrome: ChromeTheme;
  font: FontSettings;
  /**
   * Command-Center HUD glow intensity (brackets, accent glow, scanlines).
   * Mirrors the Hub's `--hub-glow-strength`. 1 = default, 0 = off.
   */
  glowStrength?: number;
}

/* ------------------------------------------------------------------ *
 * Layout — tabs and the pane tree
 * ------------------------------------------------------------------ */

export type SortKey = 'name' | 'size' | 'modified' | 'kind' | 'ext';
export type SortDir = 'asc' | 'desc';
export type ViewMode = 'details' | 'grid';

export interface PaneLeaf {
  type: 'leaf';
  id: string;
  path: string;
  /** Back/forward history for this pane. */
  history: string[];
  historyIndex: number;
  sortKey: SortKey;
  sortDir: SortDir;
  viewMode: ViewMode;
  /** Live text of the query filter bar (`ext:png size:>1mb`). */
  filter: string;
}

export interface PaneSplit {
  type: 'split';
  id: string;
  /** 'h' = side by side (a vertical divider), 'v' = stacked. */
  dir: 'h' | 'v';
  /** Fraction of the container given to `a`, 0.1..0.9. */
  ratio: number;
  a: PaneNode;
  b: PaneNode;
}

export type PaneNode = PaneLeaf | PaneSplit;

export interface TabState {
  id: string;
  root: PaneNode;
  activePaneId: string;
}

export interface SessionState {
  tabs: TabState[];
  activeTabId: string;
}

/** A user-pinned sidebar entry. */
export interface Place {
  name: string;
  path: string;
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

export interface Settings {
  /** Name of the active theme (a preset name or a custom theme name). */
  activeTheme: string;
  /** User-created themes, persisted across restarts. */
  customThemes: Theme[];
  /** 1.0 = fully opaque. */
  windowOpacity: number;
  /** Font-zoom offset (Ctrl +/-/0), added to the active theme's font size. */
  fontSizeOffset: number;
  showHidden: boolean;
  showSystem: boolean;
  /** Sort directories above files regardless of the sort column. */
  foldersFirst: boolean;
  previewVisible: boolean;
  sidebarVisible: boolean;
  confirmDelete: boolean;
  /** Delete key sends to the Recycle Bin (true) or deletes permanently. */
  deleteToTrash: boolean;
  /** Compute and show real folder sizes in the background. */
  showFolderSizes: boolean;
  showGitStatus: boolean;
  pinned: Place[];
  /** Restored on launch when present. */
  session?: SessionState;
}

export const DEFAULT_SETTINGS: Settings = {
  activeTheme: 'Lime',
  customThemes: [],
  windowOpacity: 1,
  fontSizeOffset: 0,
  showHidden: false,
  showSystem: false,
  foldersFirst: true,
  previewVisible: true,
  sidebarVisible: true,
  confirmDelete: true,
  deleteToTrash: true,
  showFolderSizes: true,
  showGitStatus: true,
  pinned: [],
};

export type WindowControlAction = 'minimize' | 'maximize' | 'close';

/* ------------------------------------------------------------------ *
 * The IPC contract
 * ------------------------------------------------------------------ */

/**
 * The narrow, typed surface exposed to the renderer on `window.onyx`
 * (implemented in preload via contextBridge). This is the entire IPC contract.
 *
 * Note this is the *transport*, not the app-level API the UI codes against —
 * that is `FsApi` (src/renderer/fs-api.ts), which this backs in the standalone
 * app and which V's Hub backs with its own main process. See §4 of the handoff.
 */
export interface OnyxBridge {
  // --- reading ---
  readDir(path: string): Promise<DirListing>;
  drives(): Promise<DriveInfo[]>;
  homeDir(): Promise<string>;
  knownFolders(): Promise<Place[]>;
  /** Resolve/normalize user-typed input ("~", "%USERPROFILE%", "docs") to a real path, or null. */
  resolvePath(input: string, base: string): Promise<string | null>;
  parentOf(path: string): Promise<string | null>;

  // --- watching ---
  /** Start watching a directory. Safe to call repeatedly for the same path. */
  watch(path: string): void;
  unwatch(path: string): void;
  /** Subscribe to every watcher's events. Returns unsubscribe. */
  onFsEvent(cb: (ev: FsEvent) => void): () => void;

  // --- mutating ---
  open(path: string): Promise<OpResult>;
  revealInExplorer(path: string): Promise<OpResult>;
  openTerminalAt(path: string): Promise<OpResult>;
  copy(srcs: string[], destDir: string, policy: ConflictPolicy): Promise<OpResult>;
  move(srcs: string[], destDir: string, policy: ConflictPolicy): Promise<OpResult>;
  rename(path: string, newName: string): Promise<OpResult>;
  /** Batch rename: [oldPath, newName] pairs applied as ONE undoable operation. */
  renameMany(pairs: { path: string; newName: string }[]): Promise<OpResult>;
  remove(paths: string[], toTrash: boolean): Promise<OpResult>;
  mkdir(parent: string, name: string): Promise<OpResult>;
  newFile(parent: string, name: string): Promise<OpResult>;
  undo(): Promise<OpResult>;
  /** Label of the operation undo would reverse, or null when the stack is empty. */
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
  search(q: SearchQuery): void;
  cancelSearch(id: string): void;
  onSearchHit(cb: (id: string, hit: SearchHit) => void): () => void;
  onSearchDone(cb: (id: string, truncated: boolean) => void): () => void;

  // --- drag & drop ---
  /** Absolute path of a dropped File, or '' if it has none (not a real file). */
  getPathForFile(file: File): string;
  /** Start an OS-level drag of these paths (drag OUT to Explorer). */
  startDrag(paths: string[]): void;

  // --- app ---
  loadSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  pickFolder(): Promise<string | null>;
  windowControl(action: WindowControlAction): void;
  setOpacity(v: number): void;
  onWindowState(cb: (maximized: boolean) => void): () => void;
  getAppVersion(): Promise<string>;
}

declare global {
  interface Window {
    onyx: OnyxBridge;
  }
}

/* ------------------------------------------------------------------ *
 * IPC channel names — one place, so main and preload can't drift.
 * ------------------------------------------------------------------ */

export const CH = {
  readDir: 'fs:readDir',
  drives: 'fs:drives',
  homeDir: 'fs:homeDir',
  knownFolders: 'fs:knownFolders',
  resolvePath: 'fs:resolvePath',
  parentOf: 'fs:parentOf',

  watch: 'fs:watch',
  unwatch: 'fs:unwatch',
  fsEvent: 'fs:event',

  open: 'op:open',
  reveal: 'op:reveal',
  openTerminal: 'op:openTerminal',
  copy: 'op:copy',
  move: 'op:move',
  rename: 'op:rename',
  renameMany: 'op:renameMany',
  remove: 'op:remove',
  mkdir: 'op:mkdir',
  newFile: 'op:newFile',
  undo: 'op:undo',
  undoLabel: 'op:undoLabel',
  opProgress: 'op:progress',

  clipCopy: 'clip:copy',
  clipCut: 'clip:cut',
  clipRead: 'clip:read',
  copyText: 'clip:copyText',

  preview: 'an:preview',
  folderSize: 'an:folderSize',
  gitStatus: 'an:gitStatus',
  search: 'an:search',
  cancelSearch: 'an:cancelSearch',
  searchHit: 'an:searchHit',
  searchDone: 'an:searchDone',

  startDrag: 'dnd:start',

  loadSettings: 'app:loadSettings',
  saveSettings: 'app:saveSettings',
  pickFolder: 'app:pickFolder',
  windowControl: 'app:windowControl',
  setOpacity: 'app:setOpacity',
  windowState: 'app:windowState',
  appVersion: 'app:version',
} as const;
