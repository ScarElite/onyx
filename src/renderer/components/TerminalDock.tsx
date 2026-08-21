import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Theme } from '../../shared/types';
import type { TerminalApi } from '../fs-api';
import { xtermTheme } from '../themes';
import { Terminal, type PtyApi } from '../vendor/conduit-terminal';
import { basename } from '../lib/format';
import { Icon } from './ui';
import '../vendor/conduit-terminal.css';

const MIN_HEIGHT = 90;
const MAX_FRACTION = 0.8;

export interface TerminalDockProps {
  /** One shell per tab, keyed by tab id — not per pane, which would be N shells. */
  id: string;
  /** The active pane's folder. The shell is kept here. */
  cwd: string;
  theme: Theme;
  fontSize: number;
  height: number;
  /** Optional shell override from settings; blank means auto-detect. */
  shell?: string;
  terminalApi: TerminalApi;
  /** The shell moved (a plain `cd`) — the pane should follow it. */
  onShellCwd: (cwd: string) => void;
  onHeightChange: (height: number) => void;
  onClose: () => void;
  copyText: (text: string) => void;
  openLink: (url: string) => void;
  getPathForFile: (file: File) => string;
}

/**
 * The docked terminal (handoff §2.1) — Conduit's <Terminal/> with a pty from
 * Onyx's main process, kept in step with the pane's folder in both directions.
 *
 * The component is deliberately thin: everything hard (spawning, OSC 7 parsing,
 * deciding when it's safe to inject a `Set-Location`) lives in src/main/pty.ts,
 * and everything about rendering a terminal lives in Conduit. This is the seam.
 */
export function TerminalDock({
  id,
  cwd,
  theme,
  fontSize,
  height,
  shell,
  terminalApi,
  onShellCwd,
  onHeightChange,
  onClose,
  copyText,
  openLink,
  getPathForFile,
}: TerminalDockProps): React.JSX.Element {
  const [dragging, setDragging] = useState(false);
  const [exited, setExited] = useState<number | null>(null);
  const startedRef = useRef(false);
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;
  // Read through a ref so changing the setting doesn't rebuild ptyApi (which
  // would remount the terminal); it applies to the next shell that starts.
  const shellRef = useRef(shell);
  shellRef.current = shell;

  /**
   * The pty contract handed to Conduit's <Terminal/>.
   *
   * The shell is spawned on the FIRST resize rather than on mount: that call
   * arrives once xterm has measured and fitted itself, so the pty is created at
   * the right dimensions instead of starting at 80x24 and reflowing everything
   * the shell has already printed.
   */
  const ptyApi = useMemo<PtyApi>(
    () => ({
      onData: (cb) => terminalApi.onData(id, cb),
      write: (data) => terminalApi.write(id, data),
      resize: (cols, rows) => {
        if (startedRef.current) {
          terminalApi.resize(id, cols, rows);
          return;
        }
        startedRef.current = true;
        terminalApi.start(id, cwdRef.current, cols, rows, shellRef.current);
      },
      onExit: (cb) => terminalApi.onExit(id, cb),
      kill: () => terminalApi.kill(id),
    }),
    [terminalApi, id],
  );

  // shell -> pane. Reported by the injected OSC 7 prompt on every prompt draw.
  useEffect(() => terminalApi.onCwd(id, onShellCwd), [terminalApi, id, onShellCwd]);

  useEffect(() => terminalApi.onExit(id, (code) => setExited(code)), [terminalApi, id]);

  // pane -> shell. Queued in main and flushed at the shell's next idle prompt,
  // so this never lands in the middle of a line you're typing.
  useEffect(() => {
    if (startedRef.current) terminalApi.setCwd(id, cwd);
  }, [terminalApi, id, cwd]);

  /* ---- resize handle ---- */

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      const startY = e.clientY;
      const startH = height;
      const onMove = (ev: MouseEvent) => {
        const next = startH + (startY - ev.clientY);
        onHeightChange(
          Math.round(Math.min(window.innerHeight * MAX_FRACTION, Math.max(MIN_HEIGHT, next))),
        );
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
      };
      document.body.style.cursor = 'row-resize';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [height, onHeightChange],
  );

  const xterm = useMemo(() => xtermTheme(theme), [theme]);

  return (
    <div className="dock" data-dock-id={id} style={{ height }}>
      <div
        className={`divider divider--v${dragging ? ' divider--dragging' : ''}`}
        onMouseDown={startResize}
        role="separator"
        aria-orientation="horizontal"
      />
      <div className="dock__bar">
        <span className="dock__label">
          <Icon name="terminal" />
          <span>{basename(cwd) || cwd}</span>
        </span>
        <span className="dock__spacer" />
        {exited !== null && <span className="dock__exit">shell exited ({exited})</span>}
        <button type="button" className="dock__close" title="Hide terminal (Ctrl+`)" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="dock__term">
        <Terminal
          ptyApi={ptyApi}
          theme={xterm}
          fontFamily={theme.font.family}
          fontSize={fontSize}
          active
          copyText={copyText}
          openLink={openLink}
          getFilePath={(file) => getPathForFile(file) || null}
          readClipboardText={() => navigator.clipboard.readText().catch(() => null)}
        />
      </div>
    </div>
  );
}
