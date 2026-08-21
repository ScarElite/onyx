import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as pty from 'node-pty';
import { isAbsolute, normalize } from './fs-service';

/**
 * The terminal dock's shells — one pty per docked terminal, keyed by pane id.
 *
 * The interesting part is cwd sync (handoff §2.1). Explorer's "Open in Terminal"
 * is one-way and one-shot; Onyx keeps the two in step in BOTH directions:
 *
 *   shell -> pane   the injected prompt emits OSC 7 on every prompt, which we
 *                   parse here and report upward, so `cd` in the shell moves
 *                   the pane.
 *   pane -> shell   navigating in the UI writes a Set-Location — but only when
 *                   the shell is actually sitting at an idle prompt. Otherwise
 *                   it's queued and flushed at the next prompt, so we never
 *                   inject a line into something you're halfway through typing
 *                   or into a running program's stdin.
 */

export interface PtySinks {
  onData: (id: string, chunk: string) => void;
  onExit: (id: string, code: number) => void;
  onCwd: (id: string, cwd: string) => void;
}

let sinks: PtySinks = { onData: () => undefined, onExit: () => undefined, onCwd: () => undefined };

export function setPtySinks(next: PtySinks): void {
  sinks = next;
}

interface PtyRec {
  proc: pty.IPty;
  cwd: string;
  /** True while the shell is believed to be at a fresh, idle prompt. */
  atPrompt: boolean;
  /** A cwd the UI asked for while the shell was busy; flushed at the next prompt. */
  pendingCd: string | null;
  /** Tail of the last chunk, so an OSC 7 split across reads still parses. */
  tail: string;
}

const ptys = new Map<string, PtyRec>();

/* ------------------------------------------------------------------ *
 * Shell + injected prompt
 * ------------------------------------------------------------------ */

/**
 * The init script, written once to the temp dir and passed with `-File`.
 *
 * Passed as a FILE rather than `-Command "..."` on purpose: the script contains
 * quotes, backslashes and escape characters, and getting all of those through
 * Windows' single-string command line intact is a well-known source of silent
 * breakage. A file has no quoting layer at all.
 *
 * It WRAPS the existing prompt rather than replacing it, so a user's customised
 * prompt (oh-my-posh, Starship, whatever) keeps working — we only prepend the
 * OSC 7 report.
 */
const INIT_SCRIPT = String.raw`
# Injected by Onyx. Reports the working directory to the host on every prompt
# via OSC 7, so the file pane can follow the shell.
if (-not $global:__onyxWrapped) {
  $global:__onyxWrapped = $true
  $global:__onyxInnerPrompt = $function:prompt
  function global:prompt {
    $p = (Get-Location).ProviderPath
    if ($p) {
      $esc = [char]27
      $bel = [char]7
      [Console]::Write("$esc]7;file:///" + ($p -replace '\\', '/') + $bel)
    }
    if ($global:__onyxInnerPrompt) { & $global:__onyxInnerPrompt } else { "PS $p> " }
  }
}
`;

let initScriptPath: string | null = null;

async function ensureInitScript(): Promise<string> {
  if (initScriptPath) return initScriptPath;
  const target = path.join(os.tmpdir(), 'onyx-shell-init.ps1');
  await fs.writeFile(target, INIT_SCRIPT, 'utf8');
  initScriptPath = target;
  return target;
}

/** PowerShell 7 when it's installed, Windows PowerShell otherwise. */
async function resolveShell(override?: string): Promise<string> {
  if (override) return override;
  const pwsh = path.join(
    process.env.ProgramFiles ?? 'C:\\Program Files',
    'PowerShell',
    '7',
    'pwsh.exe',
  );
  try {
    await fs.access(pwsh);
    return pwsh;
  } catch {
    return 'powershell.exe';
  }
}

/* ------------------------------------------------------------------ *
 * OSC 7
 * ------------------------------------------------------------------ */

// ESC ] 7 ; file://<host>/<path> (BEL | ESC \)
// eslint-disable-next-line no-control-regex -- matching terminal escape sequences is the entire point
const OSC7 = /\x1b\]7;file:\/\/[^/]*\/([^\x07\x1b]*)(?:\x07|\x1b\\)/g;

/** Pull every OSC 7 report out of a chunk; returns the last cwd seen, if any. */
function readOsc7(rec: PtyRec, chunk: string): string | null {
  // Scan the previous tail plus this chunk so a sequence split across two reads
  // is still matched; then keep a new tail for the same reason.
  const haystack = rec.tail + chunk;
  let last: string | null = null;
  let match: RegExpExecArray | null;
  OSC7.lastIndex = 0;
  while ((match = OSC7.exec(haystack)) !== null) {
    try {
      const decoded = decodeURIComponent(match[1]);
      last = normalize(decoded.replace(/\//g, '\\'));
    } catch {
      /* malformed percent-encoding — ignore this report */
    }
  }
  rec.tail = haystack.slice(-256);
  return last;
}

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

export async function startPty(
  id: string,
  cwd: string,
  cols: number,
  rows: number,
  shellOverride?: string,
): Promise<void> {
  if (ptys.has(id)) return;

  const shell = await resolveShell(shellOverride);
  const init = await ensureInitScript();
  // A caller could hand us a virtual path (Onyx's Home tab) or something that
  // has since been deleted. ConPTY's failure for that is "error code: 267",
  // which tells the user nothing, so fall back to somewhere that always exists.
  const startDir = isAbsolute(normalize(cwd))
    ? normalize(cwd)
    : normalize(process.env.USERPROFILE || 'C:\\');

  let proc: pty.IPty;
  try {
    proc = pty.spawn(
      shell,
      ['-NoLogo', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', init],
      {
        name: 'xterm-256color',
        cols: Math.max(2, cols),
        rows: Math.max(1, rows),
        cwd: startDir,
        env: process.env as Record<string, string>,
      },
    );
  } catch (e) {
    sinks.onData(id, `\r\n\x1b[31mOnyx could not start a shell: ${String(e)}\x1b[0m\r\n`);
    return;
  }

  const rec: PtyRec = { proc, cwd: startDir, atPrompt: false, pendingCd: null, tail: '' };
  ptys.set(id, rec);

  proc.onData((chunk) => {
    const reported = readOsc7(rec, chunk);
    if (reported) {
      // A prompt was drawn: the shell is idle and we know where it is.
      rec.atPrompt = true;
      if (reported.toLowerCase() !== rec.cwd.toLowerCase()) {
        rec.cwd = reported;
        sinks.onCwd(id, reported);
      }
      flushPendingCd(id, rec);
    }
    sinks.onData(id, chunk);
  });

  proc.onExit(({ exitCode }) => {
    ptys.delete(id);
    sinks.onExit(id, exitCode);
  });
}

function flushPendingCd(id: string, rec: PtyRec): void {
  const target = rec.pendingCd;
  if (!target) return;
  rec.pendingCd = null;
  if (target.toLowerCase() === rec.cwd.toLowerCase()) return;
  rec.atPrompt = false;
  // Single-quoted + doubled quotes: PowerShell's literal-string escaping, so a
  // folder called  it's "here"  survives intact.
  rec.proc.write(`Set-Location -LiteralPath '${target.replace(/'/g, "''")}'\r`);
}

export function writePty(id: string, data: string): void {
  const rec = ptys.get(id);
  if (!rec) return;
  // The user is typing or a program is reading: not a safe moment to inject.
  rec.atPrompt = false;
  rec.proc.write(data);
}

export function resizePty(id: string, cols: number, rows: number): void {
  const rec = ptys.get(id);
  if (!rec) return;
  try {
    rec.proc.resize(Math.max(2, cols), Math.max(1, rows));
  } catch {
    /* the shell exited between the resize and here */
  }
}

/** The pane navigated: move the shell too, now or at its next free prompt. */
export function setPtyCwd(id: string, cwd: string): void {
  const rec = ptys.get(id);
  if (!rec) return;
  const target = normalize(cwd);
  if (!isAbsolute(target)) return; // virtual path — leave the shell where it is
  if (target.toLowerCase() === rec.cwd.toLowerCase()) return;
  rec.pendingCd = target;
  if (rec.atPrompt) flushPendingCd(id, rec);
}

export function killPty(id: string): void {
  const rec = ptys.get(id);
  if (!rec) return;
  ptys.delete(id);
  try {
    rec.proc.kill();
  } catch {
    /* already gone */
  }
}

/** Reap every shell — on window reload, and on quit. */
export function killAllPtys(): void {
  for (const id of [...ptys.keys()]) killPty(id);
}
