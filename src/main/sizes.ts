import { promises as fs } from 'node:fs';
import path from 'node:path';
import { normalize } from './fs-service';

/**
 * Real folder sizes — the number Explorer refuses to show. Computed lazily in
 * the background, per row, and cached: the UI asks for every visible folder at
 * once, so identical requests must collapse into one walk.
 */
const TTL_MS = 60_000;
/** Stop a pathological walk (a 2M-file drive root) rather than spin forever. */
const MAX_ENTRIES = 500_000;

const cache = new Map<string, { at: number; size: number }>();
const inflight = new Map<string, Promise<number>>();

export function folderSize(dirRaw: string): Promise<number> {
  const dir = normalize(dirRaw);

  const hit = cache.get(dir);
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.size);

  const running = inflight.get(dir);
  if (running) return running;

  const job = walk(dir)
    .then((size) => {
      cache.set(dir, { at: Date.now(), size });
      return size;
    })
    .catch(() => 0)
    .finally(() => {
      inflight.delete(dir);
    });

  inflight.set(dir, job);
  return job;
}

/** Drop cached sizes for a path and every ancestor — a write changed them all. */
export function invalidateSize(pathRaw: string): void {
  const p = normalize(pathRaw).toLowerCase();
  for (const key of [...cache.keys()]) {
    const k = key.toLowerCase();
    if (p.startsWith(k) || k.startsWith(p)) cache.delete(key);
  }
}

async function walk(root: string): Promise<number> {
  let total = 0;
  let seen = 0;
  const queue: string[] = [root];

  while (queue.length > 0) {
    const dir = queue.pop() as string;

    let dirents;
    try {
      dirents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue; // access denied — count what we can, skip what we can't
    }

    for (const d of dirents) {
      if (++seen > MAX_ENTRIES) return total;

      // Never follow a link or junction: it would double-count at best and loop
      // forever at worst (handoff §9.5).
      if (d.isSymbolicLink()) continue;

      const full = path.win32.join(dir, d.name);
      if (d.isDirectory()) {
        queue.push(full);
        continue;
      }
      try {
        // lstat, not stat — and note this does NOT hydrate a cloud placeholder,
        // so sizes stay accurate without triggering a download.
        const st = await fs.lstat(full);
        total += st.size;
      } catch {
        /* vanished mid-walk */
      }
    }

    // Yield between directories so a big walk never blocks IPC.
    await new Promise((r) => setImmediate(r));
  }

  return total;
}
