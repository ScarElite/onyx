/**
 * Types for the vendored Conduit <Terminal/> bundle (see SOURCE.md).
 *
 * Hand-written because the bundle ships as plain JS. It mirrors Conduit's
 * `TerminalProps` / `PtyApi` at the pinned commit — if Conduit's contract
 * changes, re-sync the bundle and update this file with it.
 *
 * Onyx uses only a small slice of this surface (ptyApi, theme, font, active,
 * onTitle, clipboard + link hooks). The rest is declared so the compiler can
 * see the whole contract rather than silently accepting typos in props that
 * would be dropped on the floor at runtime.
 */

/** xterm's ITheme, inlined — Onyx doesn't depend on @xterm/xterm itself. */
export interface XTermTheme {
  foreground?: string;
  background?: string;
  cursor?: string;
  cursorAccent?: string;
  selectionBackground?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
}

/** The pty contract. The host injects one of these per terminal instance. */
export interface PtyApi {
  onData(cb: (chunk: string) => void): () => void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  onExit?(cb: (code: number) => void): () => void;
  kill?(): void;
}

export interface ConduitCommand {
  name: string;
  description: string;
  run: () => void;
}

export interface TerminalProps {
  ptyApi: PtyApi;
  theme: XTermTheme;
  fontFamily?: string;
  fontSize?: number;
  onTitle?: (title: string) => void;
  getClipboardImage?: () => Promise<string | null>;
  saveClipboardImageToFile?: () => Promise<string | null>;
  copyText?: (text: string) => void;
  readClipboardText?: () => Promise<string | null>;
  openLink?: (url: string) => void;
  getFilePath?: (file: File) => string | null;
  resolveDropDir?: (paths: string[]) => Promise<string | null>;
  onCommandFinished?: (exitCode: number, durationMs: number) => void;
  onBell?: () => void;
  onZoom?: (delta: number) => void;
  onResetZoom?: () => void;
  commands?: ConduitCommand[];
  /** True when this pane is the visible/active tab — triggers a refit + focus. */
  active?: boolean;
  promptRefreshToken?: number;
}

export declare function Terminal(props: TerminalProps): JSX.Element;
