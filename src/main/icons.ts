import path from 'node:path';
import { app } from 'electron';
import { normalize } from './fs-service';

/**
 * Real Windows shell icons — the artwork Explorer shows, not our hand-drawn
 * glyphs: file-association icons, a `.exe`'s embedded icon, the custom icons on
 * Desktop / Downloads / Pictures, drive icons.
 *
 * `app.getFileIcon` is a shell call per path, so the caching strategy is what
 * makes this affordable:
 *
 *   ordinary files -> cached by EXTENSION. Every .txt in a folder shares one
 *                     icon, so a 5,000-file directory costs one lookup per
 *                     distinct extension rather than 5,000 lookups.
 *   self-drawing   -> cached by PATH. An .exe, .lnk or .ico carries its own
 *                     artwork; keying those by extension would give every
 *                     program the same icon, which is exactly the thing that
 *                     makes a file manager look wrong.
 *   folders        -> cached by PATH too (special folders differ, and users
 *                     customise them with desktop.ini). Affordable only because
 *                     the renderer asks for VISIBLE rows: a virtualized list
 *                     requests ~30, not the whole listing.
 */

export type IconSize = 'small' | 'normal' | 'large';

/** Extensions whose icon belongs to the individual file, not the file type. */
const SELF_DRAWING = new Set([
  '.exe', '.lnk', '.ico', '.url', '.msc', '.cpl', '.scr', '.appref-ms', '.msi',
]);

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

/** Bound the number of shell calls in flight; the shell serialises anyway. */
const MAX_CONCURRENT = 8;
let active = 0;
const queue: (() => void)[] = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function release(): void {
  const next = queue.shift();
  if (next) next();
  else active--;
}

function cacheKey(target: string, isDir: boolean, size: IconSize): string {
  if (isDir) return `d|${size}|${target.toLowerCase()}`;
  const ext = path.win32.extname(target).toLowerCase();
  if (!ext || SELF_DRAWING.has(ext)) return `p|${size}|${target.toLowerCase()}`;
  return `e|${size}|${ext}`;
}

/**
 * PNG data URL for the shell icon of `target`, or null when the shell has
 * nothing for it (a path that vanished, a permission error). Null is a normal
 * answer, not an error: the caller falls back to its own glyph.
 */
export async function fileIcon(
  rawPath: string,
  isDir: boolean,
  size: IconSize = 'normal',
): Promise<string | null> {
  const target = normalize(rawPath);
  const key = cacheKey(target, isDir, size);

  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const running = inflight.get(key);
  if (running) return running;

  const job = (async () => {
    await acquire();
    try {
      const image = await app.getFileIcon(target, { size });
      if (image.isEmpty()) return null;
      const url = image.toDataURL();
      cache.set(key, url);
      return url;
    } catch {
      // Gone, unreadable, or a path the shell refuses. Don't cache a failure —
      // a USB drive that isn't ready now may be ready in ten seconds.
      return null;
    } finally {
      release();
      inflight.delete(key);
    }
  })();

  inflight.set(key, job);
  return job;
}

/**
 * Resolve a batch in one IPC round trip. The renderer asks for exactly the rows
 * it is about to paint, so batching turns a scroll into one message instead of
 * thirty.
 */
export async function fileIcons(
  items: { path: string; isDir: boolean }[],
  size: IconSize = 'normal',
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    items.slice(0, 400).map(async (item) => {
      const url = await fileIcon(item.path, item.isDir, size);
      if (url) out[normalize(item.path)] = url;
    }),
  );
  return out;
}
