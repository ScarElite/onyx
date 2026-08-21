import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { EntryKind, SearchHit, SearchQuery } from '../shared/types';
import { normalize } from './fs-service';

/** Files larger than this are not content-searched — they are not source. */
const CONTENT_CAP = 4 * 1024 * 1024;
/** Yield to the event loop every N entries so cancel stays responsive. */
const YIELD_EVERY = 400;

type HitSink = (id: string, hit: SearchHit) => void;
type DoneSink = (id: string, truncated: boolean) => void;

let onHit: HitSink = () => undefined;
let onDone: DoneSink = () => undefined;

export function setSearchSinks(hit: HitSink, done: DoneSink): void {
  onHit = hit;
  onDone = done;
}

const running = new Map<string, { cancelled: boolean }>();

export function cancelSearch(id: string): void {
  const rec = running.get(id);
  if (rec) rec.cancelled = true;
}

export function cancelAllSearches(): void {
  for (const rec of running.values()) rec.cancelled = true;
}

/** Build a predicate for a name/content needle, honouring regex + case flags. */
function matcher(needle: string, regex: boolean, caseSensitive: boolean): (s: string) => boolean {
  if (!needle) return () => false;
  if (regex) {
    let re: RegExp;
    try {
      re = new RegExp(needle, caseSensitive ? '' : 'i');
    } catch {
      // An invalid pattern matches nothing rather than throwing mid-walk.
      return () => false;
    }
    return (s) => re.test(s);
  }
  if (caseSensitive) return (s) => s.includes(needle);
  const lower = needle.toLowerCase();
  return (s) => s.toLowerCase().includes(lower);
}

function looksBinary(buf: Buffer): boolean {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

/**
 * Breadth-first walk from `q.root`, streaming hits as they are found so the UI
 * fills in immediately instead of waiting for a full traversal. Symlinks and
 * junctions are never followed (handoff §9.5).
 *
 * Content search deliberately does NOT skip cloud-synced files. It used to, to
 * avoid hydrating OneDrive placeholders — but "under a OneDrive root" is a path
 * prefix, not a hydration check, and on a machine whose entire Documents tree is
 * synced that guard silently disabled content search everywhere it mattered.
 * Reading an already-downloaded file costs nothing, and CONTENT_CAP keeps the
 * worst case bounded. See the README's limitations.
 */
export async function startSearch(q: SearchQuery): Promise<void> {
  const state = { cancelled: false };
  running.set(q.id, state);

  const nameMatch = matcher(q.name, q.regex, q.caseSensitive);
  const contentMatch = matcher(q.content, q.regex, q.caseSensitive);
  const wantName = !!q.name;
  const wantContent = !!q.content;

  const queue: string[] = [normalize(q.root)];
  let hits = 0;
  let seen = 0;
  let truncated = false;

  try {
    while (queue.length > 0) {
      if (state.cancelled) break;
      const dir = queue.shift() as string;

      let dirents;
      try {
        dirents = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        continue; // Access denied is routine — keep walking (handoff §9.3).
      }

      for (const d of dirents) {
        if (state.cancelled) break;
        if (hits >= q.maxHits) {
          truncated = true;
          break;
        }

        const name = d.name;
        if (!q.includeHidden && name.startsWith('.')) continue;

        const full = normalize(path.win32.join(dir, name));
        const isLink = d.isSymbolicLink();
        const isDir = d.isDirectory();
        const kind: EntryKind = isLink ? 'symlink' : isDir ? 'dir' : 'file';

        if (++seen % YIELD_EVERY === 0) await new Promise((r) => setImmediate(r));

        // A name hit is reported even when a content query is also set, so
        // searching "config" finds the folder called config too.
        if (wantName && nameMatch(name)) {
          let size = 0;
          let modified = 0;
          try {
            const st = await fs.lstat(full);
            size = st.isDirectory() ? 0 : st.size;
            modified = st.mtimeMs;
          } catch {
            /* report the hit anyway — the name matched */
          }
          onHit(q.id, { path: full, name, dir, kind, size, modified });
          hits++;
        }

        if (isDir && !isLink) {
          queue.push(full);
          continue;
        }

        if (!wantContent || isLink || isDir) continue;

        try {
          const st = await fs.lstat(full);
          if (st.size === 0 || st.size > CONTENT_CAP) continue;
          const buf = await fs.readFile(full);
          if (looksBinary(buf)) continue;
          const lines = buf.toString('utf8').split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            if (!contentMatch(lines[i])) continue;
            onHit(q.id, {
              path: full,
              name,
              dir,
              kind,
              size: st.size,
              modified: st.mtimeMs,
              line: lines[i].slice(0, 400),
              lineNo: i + 1,
            });
            hits++;
            if (hits >= q.maxHits) {
              truncated = true;
              break;
            }
          }
        } catch {
          /* unreadable file — skip */
        }
      }

      if (hits >= q.maxHits) {
        truncated = true;
        break;
      }
    }
  } finally {
    running.delete(q.id);
    onDone(q.id, truncated);
  }
}
