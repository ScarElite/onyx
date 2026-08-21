import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { shell } from 'electron';
import type { ConflictPolicy, OpKind, OpProgress, OpResult } from '../shared/types';
import { describeError, isAbsolute, isRoot, normalize, parentOf } from './fs-service';

/* ------------------------------------------------------------------ *
 * Guards — every path here came from the renderer (handoff §4, §9.8)
 * ------------------------------------------------------------------ */

/** Windows reserved device names: a file called `CON` cannot exist. */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
// eslint-disable-next-line no-control-regex -- control chars really are illegal in Windows filenames
const ILLEGAL_NAME = /[<>:"/\\|?*\u0000-\u001f]/;

/** Validate a single path segment typed by the user (rename, new folder). */
export function validateName(name: string): string | null {
  const n = name.trim();
  if (!n) return 'Name cannot be empty';
  if (n === '.' || n === '..') return 'Reserved name';
  if (ILLEGAL_NAME.test(n)) return 'Name cannot contain \\ / : * ? " < > |';
  if (RESERVED.test(n)) return `"${n}" is a reserved Windows name`;
  if (n.endsWith('.') || n.endsWith(' ')) return 'Name cannot end with a space or a period';
  if (n.length > 255) return 'Name is too long';
  return null;
}

function assertUsable(p: string): void {
  const n = normalize(p);
  if (!isAbsolute(n)) throw new Error(`Refusing to operate on a non-absolute path: ${p}`);
}

/**
 * Things we will not recursively destroy no matter what the UI asks. Cheap
 * insurance against a selection bug turning into a catastrophe.
 */
function assertDeletable(p: string): void {
  const n = normalize(p);
  assertUsable(n);
  if (isRoot(n)) throw new Error('Refusing to delete a drive root');
  const home = normalize(process.env.USERPROFILE || '');
  if (home && n.toLowerCase() === home.toLowerCase()) {
    throw new Error('Refusing to delete the user profile folder');
  }
  // C:\Windows, C:\Program Files, ...
  const parent = parentOf(n);
  if (parent && isRoot(parent) && /^(windows|program files|program files \(x86\)|users)$/i.test(path.win32.basename(n))) {
    throw new Error(`Refusing to delete a protected system folder: ${path.win32.basename(n)}`);
  }
}

/** True when `child` is `parent` or lives inside it — a move into itself. */
function isInside(child: string, parent: string): boolean {
  const c = normalize(child).toLowerCase();
  const p = normalize(parent).toLowerCase();
  return c === p || c.startsWith(p.endsWith('\\') ? p : `${p}\\`);
}

/* ------------------------------------------------------------------ *
 * The undo journal
 * ------------------------------------------------------------------ */

type Inverse =
  /** Move `from` back to `to`. */
  | { t: 'moveBack'; from: string; to: string }
  /** Remove something the operation created (goes to the Recycle Bin). */
  | { t: 'discard'; path: string };

interface UndoRecord {
  label: string;
  inverse: Inverse[];
  /**
   * False for Recycle Bin deletions: Windows exposes no API to restore a
   * specific item from the Bin, so Onyx tells the truth rather than pretending.
   */
  reversible: boolean;
  note?: string;
}

const undoStack: UndoRecord[] = [];
const UNDO_LIMIT = 50;

function journal(rec: UndoRecord): void {
  undoStack.push(rec);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}

export function undoLabel(): string | null {
  const top = undoStack[undoStack.length - 1];
  return top ? top.label : null;
}

export async function undo(): Promise<OpResult> {
  const rec = undoStack.pop();
  if (!rec) return { ok: false, error: 'Nothing to undo' };

  if (!rec.reversible) {
    return {
      ok: false,
      error: rec.note ?? `"${rec.label}" cannot be undone`,
      undoLabel: undoLabel() ?? undefined,
    };
  }

  const failures: { path: string; error: string }[] = [];
  const affected: string[] = [];

  // Apply inverses in reverse order so a multi-step operation unwinds cleanly.
  for (const step of [...rec.inverse].reverse()) {
    try {
      if (step.t === 'moveBack') {
        await fs.mkdir(path.win32.dirname(step.to), { recursive: true });
        await rename(step.from, step.to);
        affected.push(step.to);
      } else {
        await shell.trashItem(step.path);
      }
    } catch (e) {
      failures.push({ path: step.t === 'moveBack' ? step.from : step.path, error: describeError(e) });
    }
  }

  return {
    ok: failures.length === 0,
    error: failures.length ? `Undo partially failed (${failures.length})` : undefined,
    affected,
    failures: failures.length ? failures : undefined,
    undoLabel: undoLabel() ?? undefined,
  };
}

/* ------------------------------------------------------------------ *
 * Progress
 * ------------------------------------------------------------------ */

let progressSink: (p: OpProgress) => void = () => undefined;

export function setProgressSink(fn: (p: OpProgress) => void): void {
  progressSink = fn;
}

function report(id: string, kind: OpKind, done: number, total: number, current: string): void {
  progressSink({
    id,
    kind,
    fraction: total > 0 ? done / total : -1,
    current,
    done: done >= total,
  });
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function exists(p: string): Promise<boolean> {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

/** `report.txt` -> `report (2).txt`, then `(3)`, ... — Explorer's convention. */
async function uniquePath(target: string): Promise<string> {
  if (!(await exists(target))) return target;
  const dir = path.win32.dirname(target);
  const base = path.win32.basename(target);
  const ext = path.win32.extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  for (let i = 2; i < 10000; i++) {
    const candidate = normalize(path.win32.join(dir, `${stem} (${i})${ext}`));
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error('Could not find an unused name');
}

/**
 * Resolve where one source lands in `destDir`, honouring the conflict policy.
 * Returns null when the item should be skipped.
 *
 * A policy of 'ask' reaching main means the UI did not resolve it, so we fall
 * back to 'keepBoth' — the only choice that cannot destroy data.
 */
async function resolveTarget(
  destDir: string,
  name: string,
  policy: ConflictPolicy,
): Promise<{ target: string; overwrite: boolean } | null> {
  const target = normalize(path.win32.join(destDir, name));
  if (!(await exists(target))) return { target, overwrite: false };
  switch (policy) {
    case 'skip':
      return null;
    case 'overwrite':
      return { target, overwrite: true };
    default:
      return { target: await uniquePath(target), overwrite: false };
  }
}

/** `fs.rename`, falling back to copy+delete when the move crosses volumes. */
async function rename(from: string, to: string): Promise<void> {
  try {
    await fs.rename(from, to);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EXDEV') throw e;
    // Different volume: Windows cannot rename across them.
    await fs.cp(from, to, { recursive: true, force: true, errorOnExist: false });
    await fs.rm(from, { recursive: true, force: true });
  }
}

/* ------------------------------------------------------------------ *
 * Operations
 * ------------------------------------------------------------------ */

export async function copy(
  srcs: string[],
  destDirRaw: string,
  policy: ConflictPolicy,
): Promise<OpResult> {
  const destDir = normalize(destDirRaw);
  const id = randomUUID();
  const failures: { path: string; error: string }[] = [];
  const created: string[] = [];

  try {
    assertUsable(destDir);
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }

  let done = 0;
  for (const raw of srcs) {
    const src = normalize(raw);
    report(id, 'copy', done, srcs.length, src);
    try {
      assertUsable(src);
      if (isInside(destDir, src)) throw new Error('Cannot copy a folder into itself');
      const resolved = await resolveTarget(destDir, path.win32.basename(src), policy);
      if (!resolved) {
        done++;
        continue;
      }
      await fs.cp(src, resolved.target, {
        recursive: true,
        force: resolved.overwrite,
        errorOnExist: !resolved.overwrite,
      });
      created.push(resolved.target);
    } catch (e) {
      failures.push({ path: src, error: describeError(e) });
    }
    done++;
    report(id, 'copy', done, srcs.length, src);
  }

  if (created.length) {
    journal({
      label: `Copy ${created.length} item${created.length === 1 ? '' : 's'}`,
      inverse: created.map((p) => ({ t: 'discard', path: p })),
      reversible: true,
    });
  }

  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to copy` : undefined,
    affected: created,
    failures: failures.length ? failures : undefined,
    undoLabel: undoLabel() ?? undefined,
  };
}

export async function move(
  srcs: string[],
  destDirRaw: string,
  policy: ConflictPolicy,
): Promise<OpResult> {
  const destDir = normalize(destDirRaw);
  const id = randomUUID();
  const failures: { path: string; error: string }[] = [];
  const moved: { from: string; to: string }[] = [];

  try {
    assertUsable(destDir);
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }

  let done = 0;
  for (const raw of srcs) {
    const src = normalize(raw);
    report(id, 'move', done, srcs.length, src);
    try {
      assertUsable(src);
      if (isInside(destDir, src)) throw new Error('Cannot move a folder into itself');
      if (normalize(path.win32.dirname(src)).toLowerCase() === destDir.toLowerCase()) {
        // Already there — a drop onto the folder it came from.
        done++;
        continue;
      }
      const resolved = await resolveTarget(destDir, path.win32.basename(src), policy);
      if (!resolved) {
        done++;
        continue;
      }
      if (resolved.overwrite) await fs.rm(resolved.target, { recursive: true, force: true });
      await rename(src, resolved.target);
      moved.push({ from: src, to: resolved.target });
    } catch (e) {
      failures.push({ path: src, error: describeError(e) });
    }
    done++;
    report(id, 'move', done, srcs.length, src);
  }

  if (moved.length) {
    journal({
      label: `Move ${moved.length} item${moved.length === 1 ? '' : 's'}`,
      inverse: moved.map((m) => ({ t: 'moveBack', from: m.to, to: m.from })),
      reversible: true,
    });
  }

  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to move` : undefined,
    affected: moved.map((m) => m.to),
    failures: failures.length ? failures : undefined,
    undoLabel: undoLabel() ?? undefined,
  };
}

export async function renameOne(rawPath: string, newName: string): Promise<OpResult> {
  const src = normalize(rawPath);
  const bad = validateName(newName);
  if (bad) return { ok: false, error: bad };
  try {
    assertUsable(src);
    const target = normalize(path.win32.join(path.win32.dirname(src), newName.trim()));
    if (target.toLowerCase() === src.toLowerCase()) {
      // A case-only rename still has to go through, but `exists` would block it.
      await fs.rename(src, target);
    } else {
      if (await exists(target)) return { ok: false, error: `"${newName}" already exists` };
      await fs.rename(src, target);
    }
    journal({
      label: `Rename to "${path.win32.basename(target)}"`,
      inverse: [{ t: 'moveBack', from: target, to: src }],
      reversible: true,
    });
    return { ok: true, affected: [target], undoLabel: undoLabel() ?? undefined };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}

/**
 * Batch rename applied as ONE undoable operation — a 200-file rename that can
 * only be undone 200 times is not undo, it is a punishment.
 *
 * Renames go through a temporary name first so that a batch which permutes
 * names (a -> b, b -> a) does not collide with itself halfway through.
 */
export async function renameMany(pairs: { path: string; newName: string }[]): Promise<OpResult> {
  const id = randomUUID();
  const failures: { path: string; error: string }[] = [];
  const staged: { temp: string; final: string; original: string }[] = [];

  for (const p of pairs) {
    const bad = validateName(p.newName);
    if (bad) return { ok: false, error: `"${p.newName}": ${bad}` };
  }

  // Pass 1 — move every source aside to a unique temp name.
  let done = 0;
  for (const p of pairs) {
    const src = normalize(p.path);
    report(id, 'rename', done, pairs.length * 2, src);
    try {
      assertUsable(src);
      const dir = path.win32.dirname(src);
      const temp = normalize(path.win32.join(dir, `.onyx-rename-${randomUUID()}`));
      const final = normalize(path.win32.join(dir, p.newName.trim()));
      await fs.rename(src, temp);
      staged.push({ temp, final, original: src });
    } catch (e) {
      failures.push({ path: src, error: describeError(e) });
    }
    done++;
  }

  // Pass 2 — move each temp into its final name.
  const completed: { from: string; to: string }[] = [];
  for (const s of staged) {
    report(id, 'rename', done, pairs.length * 2, s.final);
    try {
      if (await exists(s.final)) throw new Error(`"${path.win32.basename(s.final)}" already exists`);
      await fs.rename(s.temp, s.final);
      completed.push({ from: s.final, to: s.original });
    } catch (e) {
      // Put it back where it came from rather than leaving a `.onyx-rename-*`
      // turd on disk.
      try {
        await fs.rename(s.temp, s.original);
      } catch {
        /* nothing more we can do */
      }
      failures.push({ path: s.original, error: describeError(e) });
    }
    done++;
  }
  report(id, 'rename', pairs.length * 2, pairs.length * 2, '');

  if (completed.length) {
    journal({
      label: `Rename ${completed.length} item${completed.length === 1 ? '' : 's'}`,
      inverse: completed.map((c) => ({ t: 'moveBack', from: c.from, to: c.to })),
      reversible: true,
    });
  }

  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to rename` : undefined,
    affected: completed.map((c) => c.from),
    failures: failures.length ? failures : undefined,
    undoLabel: undoLabel() ?? undefined,
  };
}

export async function remove(paths: string[], toTrash: boolean): Promise<OpResult> {
  const id = randomUUID();
  const failures: { path: string; error: string }[] = [];
  const removed: string[] = [];

  let done = 0;
  for (const raw of paths) {
    const p = normalize(raw);
    report(id, toTrash ? 'trash' : 'delete', done, paths.length, p);
    try {
      assertDeletable(p);
      if (toTrash) await shell.trashItem(p);
      else await fs.rm(p, { recursive: true, force: true });
      removed.push(p);
    } catch (e) {
      failures.push({ path: p, error: describeError(e) });
    }
    done++;
    report(id, toTrash ? 'trash' : 'delete', done, paths.length, p);
  }

  if (removed.length) {
    // Journaled so the label is visible in the UI, but flagged honestly: nothing
    // restores a specific item from the Windows Recycle Bin programmatically,
    // and a permanent delete is gone. See handoff §2.3.
    journal({
      label: `${toTrash ? 'Delete' : 'Permanently delete'} ${removed.length} item${removed.length === 1 ? '' : 's'}`,
      inverse: [],
      reversible: false,
      note: toTrash
        ? `${removed.length} item(s) are in the Recycle Bin — restore them from there`
        : 'Permanently deleted items cannot be recovered',
    });
  }

  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to delete` : undefined,
    affected: removed,
    failures: failures.length ? failures : undefined,
    undoLabel: undoLabel() ?? undefined,
  };
}

export async function mkdir(parentRaw: string, name: string): Promise<OpResult> {
  const bad = validateName(name);
  if (bad) return { ok: false, error: bad };
  const parent = normalize(parentRaw);
  try {
    assertUsable(parent);
    const target = normalize(path.win32.join(parent, name.trim()));
    if (await exists(target)) return { ok: false, error: `"${name}" already exists` };
    await fs.mkdir(target);
    journal({
      label: `New folder "${name.trim()}"`,
      inverse: [{ t: 'discard', path: target }],
      reversible: true,
    });
    return { ok: true, affected: [target], undoLabel: undoLabel() ?? undefined };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}

export async function newFile(parentRaw: string, name: string): Promise<OpResult> {
  const bad = validateName(name);
  if (bad) return { ok: false, error: bad };
  const parent = normalize(parentRaw);
  try {
    assertUsable(parent);
    const target = normalize(path.win32.join(parent, name.trim()));
    if (await exists(target)) return { ok: false, error: `"${name}" already exists` };
    // 'wx' fails if it appeared between the check and the write.
    await fs.writeFile(target, '', { flag: 'wx' });
    journal({
      label: `New file "${name.trim()}"`,
      inverse: [{ t: 'discard', path: target }],
      reversible: true,
    });
    return { ok: true, affected: [target], undoLabel: undoLabel() ?? undefined };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}
