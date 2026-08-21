import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitFileStatus, GitStatus } from '../shared/types';
import { findGitRoot, normalize } from './fs-service';

const execFileAsync = promisify(execFile);

/**
 * Per-repo cache. `git status` on a large work tree is not free, so a repo is
 * re-read at most every STALE_MS; a listing never blocks on it (the renderer
 * asks for badges after the rows are already painted). See handoff §9.10.
 */
const STALE_MS = 2500;
const cache = new Map<string, { at: number; status: GitStatus | null; inflight?: Promise<GitStatus | null> }>();

function mapXY(x: string, y: string): GitFileStatus {
  if (x === 'R' || y === 'R') return 'renamed';
  if (x === 'D' || y === 'D') return 'deleted';
  if (x === 'A') return 'added';
  if (x !== '.' && x !== '?') return 'modified';
  if (y !== '.' && y !== '?') return 'modified';
  return 'modified';
}

/** Severity used when rolling a file's status up onto its ancestor folders. */
const RANK: Record<GitFileStatus, number> = {
  conflicted: 6,
  deleted: 5,
  modified: 4,
  renamed: 3,
  added: 2,
  untracked: 1,
  ignored: 0,
};

export async function gitStatus(dirRaw: string): Promise<GitStatus | null> {
  const dir = normalize(dirRaw);
  const root = await findGitRoot(dir);
  if (!root) return null;

  const hit = cache.get(root);
  if (hit) {
    if (hit.inflight) return hit.inflight;
    if (Date.now() - hit.at < STALE_MS) return hit.status;
  }

  const inflight = readStatus(root)
    .then((status) => {
      cache.set(root, { at: Date.now(), status });
      return status;
    })
    .catch(() => {
      // Not a repo any more, git missing from PATH, or a corrupt index. Cache
      // the null so we do not retry on every keystroke.
      cache.set(root, { at: Date.now(), status: null });
      return null;
    });

  cache.set(root, { at: hit?.at ?? 0, status: hit?.status ?? null, inflight });
  return inflight;
}

/** Force the next gitStatus() for this path to re-read (after a file op). */
export function invalidateGit(dirRaw: string): void {
  const dir = normalize(dirRaw).toLowerCase();
  for (const root of [...cache.keys()]) {
    if (dir.startsWith(root.toLowerCase())) cache.delete(root);
  }
}

async function readStatus(root: string): Promise<GitStatus | null> {
  const { stdout } = await execFileAsync(
    'git',
    [
      'status',
      '--porcelain=v2',
      '--branch',
      '-z',
      '--untracked-files=normal',
      // 'traditional' collapses a fully-ignored folder (node_modules) into ONE
      // record instead of listing its 40,000 files.
      '--ignored=traditional',
    ],
    { cwd: root, windowsHide: true, timeout: 15000, maxBuffer: 32 * 1024 * 1024 },
  );

  const status: GitStatus = {
    root,
    branch: '',
    ahead: 0,
    behind: 0,
    dirty: 0,
    entries: {},
  };

  const fields = stdout.split('\0');
  const files: { rel: string; st: GitFileStatus }[] = [];

  for (let i = 0; i < fields.length; i++) {
    const line = fields[i];
    if (!line) continue;

    if (line.startsWith('# ')) {
      const [, key, ...rest] = line.split(' ');
      const value = rest.join(' ');
      if (key === 'branch.head') status.branch = value;
      else if (key === 'branch.ab') {
        const m = /\+(\d+)\s+-(\d+)/.exec(value);
        if (m) {
          status.ahead = Number(m[1]);
          status.behind = Number(m[2]);
        }
      }
      continue;
    }

    const tag = line[0];
    if (tag === '1') {
      const parts = line.split(' ');
      files.push({ rel: parts.slice(8).join(' '), st: mapXY(parts[1][0], parts[1][1]) });
    } else if (tag === '2') {
      // Rename/copy: with -z the ORIGINAL path is the next NUL-separated field.
      const parts = line.split(' ');
      files.push({ rel: parts.slice(9).join(' '), st: 'renamed' });
      i++;
    } else if (tag === 'u') {
      const parts = line.split(' ');
      files.push({ rel: parts.slice(10).join(' '), st: 'conflicted' });
    } else if (tag === '?') {
      files.push({ rel: line.slice(2), st: 'untracked' });
    } else if (tag === '!') {
      files.push({ rel: line.slice(2), st: 'ignored' });
    }
  }

  for (const { rel, st } of files) {
    // git speaks forward slashes; the rest of Onyx speaks Windows.
    const clean = rel.replace(/\/+$/, '');
    const abs = normalize(path.win32.join(root, clean.replace(/\//g, '\\')));
    assign(status.entries, abs, st);
    if (st !== 'ignored') status.dirty++;

    // Roll the status up onto ancestor folders so a collapsed folder row still
    // shows that something inside it changed. Ignored entries do NOT roll up —
    // node_modules being ignored says nothing about its parent.
    if (st === 'ignored') continue;
    let cur = path.win32.dirname(abs);
    while (cur.length >= root.length) {
      const norm = normalize(cur);
      if (norm.toLowerCase() === root.toLowerCase()) break;
      assign(status.entries, norm, st);
      const next = path.win32.dirname(norm);
      if (next === cur) break;
      cur = next;
    }
  }

  return status;
}

function assign(map: Record<string, GitFileStatus>, key: string, st: GitFileStatus): void {
  const existing = map[key];
  if (!existing || RANK[st] > RANK[existing]) map[key] = st;
}
