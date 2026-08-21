import { promises as fs, watch as fsWatch, type FSWatcher } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { app } from 'electron';
import type { DirListing, DriveInfo, EntryKind, FsEntry, FsEvent, Place } from '../shared/types';

const execFileAsync = promisify(execFile);

/* ------------------------------------------------------------------ *
 * Path handling — Windows paths are not POSIX paths (handoff §9.1)
 * ------------------------------------------------------------------ */

/**
 * Normalize any user- or UI-supplied path to a canonical absolute form:
 * `C:` -> `C:\`, trailing separators stripped except on a root, `..` collapsed.
 */
export function normalize(p: string): string {
  let n = path.win32.normalize(String(p).trim());
  if (/^[a-zA-Z]:$/.test(n)) n = `${n}\\`;
  // Keep the trailing slash on roots (`C:\`, `\\server\share\`) — Windows needs
  // it to distinguish "the root" from "the drive's current directory".
  if (n.length > 3 && n.endsWith('\\') && !isRoot(n)) n = n.slice(0, -1);
  return n;
}

export function isRoot(p: string): boolean {
  return /^[a-zA-Z]:\\$/.test(p) || /^\\\\[^\\]+\\[^\\]+\\?$/.test(p);
}

export function isAbsolute(p: string): boolean {
  return path.win32.isAbsolute(p);
}

export function parentOf(p: string): string | null {
  const n = normalize(p);
  if (isRoot(n)) return null;
  const parent = normalize(path.win32.dirname(n));
  return parent === n ? null : parent;
}

/**
 * Roots of cloud-synced trees (OneDrive personal/commercial), read from the
 * environment the shell hands us. Files under these may be *placeholders*:
 * present in the listing but not on disk, where reading content silently
 * triggers a download. See handoff §9.6.
 *
 * Detecting the real `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` bit needs a native
 * module Node doesn't expose, so this prefix check is the dependency-free
 * approximation: it is conservative (may flag a fully-downloaded file) and only
 * ever makes Onyx *less* eager to read a file's bytes, never less correct.
 * `stat` does not hydrate a placeholder, so sizes and dates stay accurate.
 */
const CLOUD_ROOTS: string[] = [
  process.env.OneDrive,
  process.env.OneDriveConsumer,
  process.env.OneDriveCommercial,
]
  .filter((v): v is string => !!v)
  .map((v) => normalize(v).toLowerCase());

export function isCloudPath(p: string): boolean {
  const lower = normalize(p).toLowerCase();
  return CLOUD_ROOTS.some((root) => lower === root || lower.startsWith(`${root}\\`));
}

/**
 * Windows items that are hidden/system but carry no naming convention that says
 * so. Node's `Stats` does not surface Windows file attributes, so hidden-ness is
 * inferred from the dot-prefix convention plus this list. That covers the cases
 * that actually appear in a listing; anything missed simply shows up when it
 * would otherwise have been hidden, which is a benign failure.
 */
const SYSTEM_NAMES = new Set(
  [
    '$recycle.bin',
    'system volume information',
    'pagefile.sys',
    'hiberfil.sys',
    'swapfile.sys',
    'dumpstack.log',
    'dumpstack.log.tmp',
    'config.msi',
    'recovery',
    'msocache',
    'documents and settings',
    'desktop.ini',
    'thumbs.db',
    '$windows.~bt',
    '$windows.~ws',
    'onedrivetemp',
    'system.sav',
  ].map((s) => s.toLowerCase()),
);

/* ------------------------------------------------------------------ *
 * Listing
 * ------------------------------------------------------------------ */

/** Run `fn` over `items` with at most `limit` in flight. Keeps input order. */
async function mapPool<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

function describeError(e: unknown): string {
  const err = e as NodeJS.ErrnoException;
  switch (err?.code) {
    case 'EPERM':
    case 'EACCES':
      return 'Access denied';
    case 'ENOENT':
      return 'Folder not found';
    case 'ENOTDIR':
      return 'Not a folder';
    case 'EBUSY':
      return 'In use by another program';
    case 'ENOTEMPTY':
      return 'Folder is not empty';
    case 'EEXIST':
      return 'Already exists';
    case 'EINVAL':
      return 'Invalid path';
    case 'EMFILE':
    case 'ENFILE':
      return 'Too many open files';
    default:
      return err?.message || String(e);
  }
}

function extOf(name: string, isDir: boolean): string {
  if (isDir) return '';
  const e = path.win32.extname(name);
  return e ? e.slice(1).toLowerCase() : '';
}

/**
 * Build one row. `lstat` (not `stat`) so a junction or symlink is described as
 * itself rather than silently following into a loop — `C:\Users\All Users` ->
 * `C:\ProgramData` is the classic offender (handoff §9.5).
 */
async function toEntry(dir: string, name: string, dirent: { isDirectory(): boolean; isSymbolicLink(): boolean }): Promise<FsEntry> {
  const full = normalize(path.win32.join(dir, name));
  const lower = name.toLowerCase();
  const hidden = name.startsWith('.') || SYSTEM_NAMES.has(lower);
  const system = SYSTEM_NAMES.has(lower);

  let kind: EntryKind = dirent.isDirectory() ? 'dir' : 'file';
  if (dirent.isSymbolicLink()) {
    // A Windows junction reports as a link but behaves as a directory; resolve
    // once so the row can be opened, and mark it so sizing/search won't recurse.
    kind = 'symlink';
    try {
      const target = await fs.stat(full);
      if (target.isDirectory()) kind = 'junction';
    } catch {
      /* broken link — leave it as 'symlink' */
    }
  }

  const base: FsEntry = {
    name,
    path: full,
    kind,
    size: 0,
    modified: 0,
    created: 0,
    hidden,
    system,
    readonly: false,
    placeholder: false,
    inaccessible: false,
    ext: extOf(name, kind === 'dir'),
  };

  try {
    const st = await fs.lstat(full);
    base.size = kind === 'dir' ? 0 : st.size;
    base.modified = st.mtimeMs;
    base.created = st.birthtimeMs || st.ctimeMs;
    // On Windows Node clears the owner-write bit for read-only items; that is
    // the one attribute it does expose.
    base.readonly = (st.mode & 0o200) === 0;
    base.placeholder = kind === 'file' && isCloudPath(full);
  } catch {
    // A permission error or a delete that raced us. Keep the row — a listing
    // must never be killed by one bad entry (handoff §9.3).
    base.inaccessible = true;
  }

  return base;
}

export async function readDir(dirPath: string): Promise<DirListing> {
  const dir = normalize(dirPath);

  if (!isAbsolute(dir)) return { path: dir, entries: [], error: 'Not an absolute path' };

  let dirents;
  try {
    // withFileTypes gives name + type from a single syscall — no stat needed to
    // know whether a row is a folder (handoff §9.4).
    dirents = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    return { path: dir, entries: [], error: describeError(e) };
  }

  const entries = await mapPool(dirents, 48, (d) => toEntry(dir, d.name, d));
  const failed = entries.filter((e) => e.inaccessible).length;

  const listing: DirListing = { path: dir, entries };
  if (failed > 0) {
    listing.warning = `${failed} item${failed === 1 ? '' : 's'} could not be read`;
  }

  const gitRoot = await findGitRoot(dir);
  if (gitRoot) listing.gitRoot = gitRoot;

  return listing;
}

/** Walk up looking for a `.git` entry (a file, for worktrees, or a directory). */
export async function findGitRoot(dir: string): Promise<string | undefined> {
  let cur = normalize(dir);
  for (;;) {
    try {
      await fs.stat(path.win32.join(cur, '.git'));
      return cur;
    } catch {
      /* keep walking */
    }
    const parent = parentOf(cur);
    if (!parent) return undefined;
    cur = parent;
  }
}

/* ------------------------------------------------------------------ *
 * Drives
 * ------------------------------------------------------------------ */

interface RawDisk {
  DeviceID?: string;
  VolumeName?: string;
  Size?: number | string | null;
  FreeSpace?: number | string | null;
  DriveType?: number;
}

const DRIVE_TYPE_LABEL: Record<number, string> = {
  2: 'Removable Disk',
  3: 'Local Disk',
  4: 'Network Drive',
  5: 'CD Drive',
  6: 'RAM Disk',
};

let driveCache: { at: number; drives: DriveInfo[] } | null = null;

export async function drives(): Promise<DriveInfo[]> {
  // Enumerating volumes shells out, so cache briefly — the sidebar asks on every
  // mount and the answer changes only when hardware does.
  if (driveCache && Date.now() - driveCache.at < 5000) return driveCache.drives;

  let result: DriveInfo[] = [];
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,VolumeName,Size,FreeSpace,DriveType | ConvertTo-Json -Compress',
      ],
      { windowsHide: true, timeout: 8000, maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout.trim() || '[]');
    const list: RawDisk[] = Array.isArray(parsed) ? parsed : [parsed];
    result = list
      .filter((d) => !!d.DeviceID)
      .map((d) => {
        const total = Number(d.Size ?? 0) || 0;
        const free = Number(d.FreeSpace ?? 0) || 0;
        const letter = String(d.DeviceID);
        return {
          letter,
          path: `${letter}\\`,
          label: d.VolumeName || DRIVE_TYPE_LABEL[d.DriveType ?? 3] || 'Drive',
          total,
          free,
          // Size comes back null for an empty card reader or ejected disc.
          ready: total > 0,
        };
      });
  } catch {
    result = [];
  }

  if (result.length === 0) result = await probeDrives();

  driveCache = { at: Date.now(), drives: result };
  return result;
}

/** Fallback when PowerShell is unavailable: probe letters and use statfs. */
async function probeDrives(): Promise<DriveInfo[]> {
  const found: DriveInfo[] = [];
  for (let i = 0; i < 26; i++) {
    const letter = `${String.fromCharCode(65 + i)}:`;
    const root = `${letter}\\`;
    try {
      await fs.access(root);
    } catch {
      continue;
    }
    let total = 0;
    let free = 0;
    try {
      const st = await fs.statfs(root);
      total = Number(st.blocks) * Number(st.bsize);
      free = Number(st.bavail) * Number(st.bsize);
    } catch {
      /* not ready */
    }
    found.push({ letter, path: root, label: 'Drive', total, free, ready: total > 0 });
  }
  return found;
}

/* ------------------------------------------------------------------ *
 * Known folders + path resolution
 * ------------------------------------------------------------------ */

export function homeDir(): string {
  return normalize(app.getPath('home'));
}

export function knownFolders(): Place[] {
  const wanted: { name: string; key: Parameters<typeof app.getPath>[0] }[] = [
    { name: 'Desktop', key: 'desktop' },
    { name: 'Downloads', key: 'downloads' },
    { name: 'Documents', key: 'documents' },
    { name: 'Pictures', key: 'pictures' },
    { name: 'Music', key: 'music' },
    { name: 'Videos', key: 'videos' },
  ];
  const out: Place[] = [];
  for (const { name, key } of wanted) {
    try {
      out.push({ name, path: normalize(app.getPath(key)) });
    } catch {
      /* a known folder can be undefined on some systems — just skip it */
    }
  }
  return out;
}

/**
 * Turn whatever the user typed in the breadcrumb or the palette into a real
 * path: `~`, `%USERPROFILE%`, a relative segment, or a quoted path pasted from
 * somewhere else. Returns null when nothing on disk matches.
 */
export async function resolvePath(input: string, base: string): Promise<string | null> {
  let s = String(input).trim();
  if (!s) return null;
  // Strip a surrounding pair of quotes (paths copied out of a terminal).
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  if (s === '~' || s.startsWith('~\\') || s.startsWith('~/')) {
    s = path.win32.join(os.homedir(), s.slice(1));
  }
  s = s.replace(/%([^%]+)%/g, (m, name: string) => process.env[name] ?? m);

  const candidate = path.win32.isAbsolute(s) ? normalize(s) : normalize(path.win32.join(base, s));
  try {
    await fs.stat(candidate);
    return candidate;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Watching
 * ------------------------------------------------------------------ */

/**
 * One watcher per watched directory, ref-counted across panes (two panes showing
 * the same folder share a watcher). Non-recursive by design: watching a drive
 * root recursively will melt the machine, and we do not need per-event detail —
 * any event means "re-list this folder", which sidesteps `fs.watch`'s inability
 * to correlate the delete+create pair a rename produces (handoff §9.2).
 */
interface WatchRec {
  watcher: FSWatcher;
  refs: number;
  timer: NodeJS.Timeout | null;
}

const watchers = new Map<string, WatchRec>();
let emit: (ev: FsEvent) => void = () => undefined;

export function setFsEventSink(fn: (ev: FsEvent) => void): void {
  emit = fn;
}

export function watch(dirPath: string): void {
  const dir = normalize(dirPath);
  const existing = watchers.get(dir);
  if (existing) {
    existing.refs++;
    return;
  }

  let watcher: FSWatcher;
  try {
    watcher = fsWatch(dir, { persistent: true, recursive: false });
  } catch {
    // Unwatchable (permissions, or a path that vanished). Not fatal: the folder
    // simply won't auto-refresh.
    return;
  }

  const rec: WatchRec = { watcher, refs: 1, timer: null };

  watcher.on('change', (_type, filename) => {
    // Coalesce bursts — a single copy can fire dozens of events per file.
    if (rec.timer) return;
    rec.timer = setTimeout(() => {
      rec.timer = null;
      const name = typeof filename === 'string' ? filename : '';
      emit({
        kind: 'change',
        dir,
        path: name ? normalize(path.win32.join(dir, name)) : dir,
      });
    }, 120);
  });

  // A watched folder being deleted or a drive being ejected surfaces here.
  watcher.on('error', () => closeWatcher(dir));

  watchers.set(dir, rec);
}

export function unwatch(dirPath: string): void {
  const dir = normalize(dirPath);
  const rec = watchers.get(dir);
  if (!rec) return;
  rec.refs--;
  if (rec.refs <= 0) closeWatcher(dir);
}

function closeWatcher(dir: string): void {
  const rec = watchers.get(dir);
  if (!rec) return;
  if (rec.timer) clearTimeout(rec.timer);
  try {
    rec.watcher.close();
  } catch {
    /* already gone */
  }
  watchers.delete(dir);
}

/** Drop every watcher — called when the window reloads or the app quits. */
export function closeAllWatchers(): void {
  for (const dir of [...watchers.keys()]) closeWatcher(dir);
}

export { describeError };
