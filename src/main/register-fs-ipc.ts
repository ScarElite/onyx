import { app, clipboard, dialog, shell, type BrowserWindow, type IpcMain } from 'electron';
import { spawn } from 'node:child_process';

import { CH, type FsEvent, type OpProgress, type SearchHit, type Settings } from '../shared/types';
import * as fsService from './fs-service';
import * as ops from './ops';
import { preview } from './preview';
import { fileIcons } from './icons';
import { gitStatus, invalidateGit } from './git';
import { folderSize, invalidateSize } from './sizes';
import { cancelSearch, setSearchSinks, startSearch } from './search';

/**
 * Everything the embeddable <Explorer/> needs from a main process, registered
 * against whatever host supplies it.
 *
 * This exists because Onyx runs in two places: its own app, and as a panel
 * inside V's Command Hub. The renderer half was always host-agnostic (see
 * `fs-api.ts` — the UI codes against `FsApi` and imports no `electron`), but the
 * main half used to be inlined in `main.ts`, which left the Hub two bad options:
 * reimplement ~1,900 lines of filesystem handling, or import Onyx's whole app.
 * The gotchas this code already handles (OneDrive placeholders, junction loops,
 * MAX_PATH, per-entry permission failures) are exactly what a reimplementation
 * gets wrong — silently, and months later.
 *
 * So: one implementation, two callers. `main.ts` calls this with its own window
 * and electron-store; V's Hub calls it with its window and its own settings
 * file. What stays behind in `main.ts` is only what is genuinely app-specific —
 * the pty dock, window chrome, and auto-update.
 */
export interface FsIpcHost {
  ipcMain: IpcMain;
  /** Push a main -> renderer channel. The host decides which webContents. */
  send: (channel: string, ...args: unknown[]) => void;
  /** Parent for the folder picker; null is tolerated (the picker no-ops). */
  getWindow: () => BrowserWindow | null;
  loadSettings: () => Settings | Promise<Settings>;
  saveSettings: (s: Settings) => void | Promise<void>;
}

/**
 * Onyx's own cut/copy buffer for file paths.
 *
 * Windows file clipboard interop needs CF_HDROP plus a "Preferred DropEffect"
 * blob, which Electron's clipboard API does not model. Rather than ship a
 * half-working shell integration, Onyx keeps its own buffer (fully correct
 * inside Onyx) and mirrors the paths to the OS clipboard as TEXT, so Ctrl+V in
 * a terminal or a text field still does something useful.
 */
let fileClipboard: { paths: string[]; cut: boolean } = { paths: [], cut: false };

export function registerFsIpc(host: FsIpcHost): void {
  const { ipcMain, send, getWindow } = host;

  // --- push channels: main -> renderer ---
  fsService.setFsEventSink((ev: FsEvent) => {
    invalidateGit(ev.dir);
    invalidateSize(ev.dir);
    send(CH.fsEvent, ev);
  });
  ops.setProgressSink((p: OpProgress) => send(CH.opProgress, p));
  setSearchSinks(
    (id: string, hit: SearchHit) => send(CH.searchHit, id, hit),
    (id: string, truncated: boolean) => send(CH.searchDone, id, truncated),
  );

  // --- reading ---
  ipcMain.handle(CH.readDir, (_e, p: string) => fsService.readDir(p));
  ipcMain.handle(CH.drives, () => fsService.drives());
  ipcMain.handle(CH.homeDir, () => fsService.homeDir());
  ipcMain.handle(CH.knownFolders, () => fsService.knownFolders());
  ipcMain.handle(CH.resolvePath, (_e, input: string, base: string) =>
    fsService.resolvePath(input, base),
  );
  ipcMain.handle(CH.parentOf, (_e, p: string) => fsService.parentOf(p));

  // --- watching ---
  ipcMain.on(CH.watch, (_e, p: string) => fsService.watch(p));
  ipcMain.on(CH.unwatch, (_e, p: string) => fsService.unwatch(p));

  // --- mutating ---
  ipcMain.handle(CH.open, async (_e, p: string) => {
    const err = await shell.openPath(fsService.normalize(p));
    return err ? { ok: false, error: err } : { ok: true };
  });

  ipcMain.handle(CH.reveal, (_e, p: string) => {
    shell.showItemInFolder(fsService.normalize(p));
    return { ok: true };
  });

  ipcMain.handle(CH.openTerminal, (_e, p: string) => {
    const cwd = fsService.normalize(p);
    try {
      // Windows Terminal when it's installed, plain PowerShell otherwise.
      // detached + unref so closing the host doesn't take the shell with it.
      const child = spawn('wt.exe', ['-d', cwd], { detached: true, stdio: 'ignore' });
      child.on('error', () => {
        const quoted = cwd.replace(/'/g, "''");
        spawn('powershell.exe', ['-NoExit', '-Command', `Set-Location -LiteralPath '${quoted}'`], {
          detached: true,
          stdio: 'ignore',
          cwd,
        }).unref();
      });
      child.unref();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  ipcMain.handle(CH.conflicts, (_e, srcs: string[], dest: string) => ops.conflicts(srcs, dest));
  ipcMain.handle(CH.copy, (_e, srcs: string[], dest: string, policy) =>
    ops.copy(srcs, dest, policy),
  );
  ipcMain.handle(CH.move, (_e, srcs: string[], dest: string, policy) =>
    ops.move(srcs, dest, policy),
  );
  ipcMain.handle(CH.rename, (_e, p: string, newName: string) => ops.renameOne(p, newName));
  ipcMain.handle(CH.renameMany, (_e, pairs) => ops.renameMany(pairs));
  ipcMain.handle(CH.remove, (_e, paths: string[], toTrash: boolean) => ops.remove(paths, toTrash));
  ipcMain.handle(CH.mkdir, (_e, parent: string, name: string) => ops.mkdir(parent, name));
  ipcMain.handle(CH.newFile, (_e, parent: string, name: string) => ops.newFile(parent, name));
  ipcMain.handle(CH.undo, () => ops.undo());
  ipcMain.handle(CH.undoLabel, () => ops.undoLabel());

  // --- clipboard ---
  ipcMain.handle(CH.clipCopy, (_e, paths: string[]) => {
    fileClipboard = { paths, cut: false };
    clipboard.writeText(paths.join('\r\n'));
    return { ok: true };
  });
  ipcMain.handle(CH.clipCut, (_e, paths: string[]) => {
    fileClipboard = { paths, cut: true };
    clipboard.writeText(paths.join('\r\n'));
    return { ok: true };
  });
  ipcMain.handle(CH.clipRead, () => fileClipboard);
  ipcMain.on(CH.copyText, (_e, text: string) => clipboard.writeText(text));

  // --- analysis ---
  ipcMain.handle(CH.preview, (_e, p: string) => preview(p));
  ipcMain.handle(CH.fileIcons, (_e, items, size) => fileIcons(items, size));
  ipcMain.handle(CH.folderSize, (_e, p: string) => folderSize(p));
  ipcMain.handle(CH.gitStatus, (_e, dir: string) => gitStatus(dir));
  ipcMain.on(CH.search, (_e, q) => void startSearch(q));
  ipcMain.on(CH.cancelSearch, (_e, id: string) => cancelSearch(id));

  // --- drag out to Explorer ---
  ipcMain.on(CH.startDrag, (e, paths: string[]) => {
    if (!paths.length) return;
    // startDrag REQUIRES a non-empty icon or it throws and the drag silently
    // dies; the file's own shell icon is both valid and the right visual.
    void app
      .getFileIcon(fsService.normalize(paths[0]), { size: 'normal' })
      .then((icon) => {
        const files = paths.map(fsService.normalize);
        // `file` is required by the type even when `files` carries the real
        // payload; Electron uses `files` when it is present.
        e.sender.startDrag({ file: files[0], files, icon });
      })
      .catch(() => undefined);
  });

  // --- app ---
  ipcMain.handle(CH.loadSettings, () => host.loadSettings());
  ipcMain.handle(CH.saveSettings, (_e, s: Settings) => host.saveSettings(s));
  ipcMain.handle(CH.pickFolder, async () => {
    const win = getWindow();
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    return res.canceled || !res.filePaths[0] ? null : fsService.normalize(res.filePaths[0]);
  });
  ipcMain.handle(CH.appVersion, () => app.getVersion());
}
