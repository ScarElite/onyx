import { app, BrowserWindow, clipboard, dialog, ipcMain, net, protocol, shell } from 'electron';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import started from 'electron-squirrel-startup';

import { CH, type FsEvent, type OpProgress, type SearchHit, type Settings } from '../shared/types';
import * as fsService from './fs-service';
import * as ops from './ops';
import { preview } from './preview';
import { gitStatus, invalidateGit } from './git';
import { folderSize, invalidateSize } from './sizes';
import { cancelAllSearches, cancelSearch, setSearchSinks, startSearch } from './search';
import { loadSettings, saveSettings } from './settings';

// Squirrel fires this on install/update shortcut creation; quit immediately.
if (started) app.quit();

/**
 * Media (images, video, audio, PDF) reaches the renderer over this scheme rather
 * than `file:`. In dev the renderer's origin is the Vite dev server, and
 * Chromium refuses a cross-origin `file:` fetch regardless of CSP — a custom
 * scheme sidesteps that, streams range requests (so video scrubbing works), and
 * keeps a single auditable place where a path becomes readable bytes.
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'onyx-media',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

let mainWindow: BrowserWindow | null = null;

/* ------------------------------------------------------------------ *
 * Window
 * ------------------------------------------------------------------ */

const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

function contentSecurityPolicy(): string {
  const common = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: onyx-media:",
    "media-src 'self' blob: onyx-media:",
    'frame-src onyx-media:',
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ];
  if (isDev) {
    // Vite's HMR client injects inline scripts and opens a websocket.
    return [
      ...common,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' ws: http://localhost:* http://127.0.0.1: onyx-media:",
    ].join('; ');
  }
  return [...common, "script-src 'self'", "connect-src 'self' onyx-media:"].join('; ');
}

function createWindow(): void {
  const settings = loadSettings();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 460,
    // Frameless: Onyx draws its own HUD title bar, like Conduit.
    frame: false,
    backgroundColor: '#080a09',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (settings.windowOpacity < 1) mainWindow?.setOpacity(settings.windowOpacity);
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy()],
      },
    });
  });

  // The renderer has no business navigating anywhere, and window.open should
  // hand links to the user's browser rather than spawning a chromeless window.
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url !== mainWindow?.webContents.getURL()) e.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  const notifyState = () => mainWindow?.webContents.send(CH.windowState, mainWindow.isMaximized());
  mainWindow.on('maximize', notifyState);
  mainWindow.on('unmaximize', notifyState);

  // A reload re-runs the renderer from scratch; every watcher and search it
  // registered belongs to a window that no longer exists.
  mainWindow.webContents.on('did-start-loading', () => {
    fsService.closeAllWatchers();
    cancelAllSearches();
  });

  mainWindow.on('closed', () => {
    fsService.closeAllWatchers();
    cancelAllSearches();
    mainWindow = null;
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
}

/* ------------------------------------------------------------------ *
 * App lifecycle
 * ------------------------------------------------------------------ */

app.whenReady().then(() => {
  protocol.handle('onyx-media', (request) => {
    const target = new URL(request.url).searchParams.get('p');
    if (!target) return new Response('Bad request', { status: 400 });
    const resolved = fsService.normalize(target);
    if (!fsService.isAbsolute(resolved)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(resolved).toString(), { bypassCustomProtocolHandlers: true });
  });

  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ------------------------------------------------------------------ *
 * IPC
 * ------------------------------------------------------------------ */

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

function registerIpc(): void {
  // Push channels — main -> renderer.
  fsService.setFsEventSink((ev: FsEvent) => {
    invalidateGit(ev.dir);
    invalidateSize(ev.dir);
    mainWindow?.webContents.send(CH.fsEvent, ev);
  });
  ops.setProgressSink((p: OpProgress) => mainWindow?.webContents.send(CH.opProgress, p));
  setSearchSinks(
    (id: string, hit: SearchHit) => mainWindow?.webContents.send(CH.searchHit, id, hit),
    (id: string, truncated: boolean) => mainWindow?.webContents.send(CH.searchDone, id, truncated),
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
      // detached + unref so closing Onyx doesn't take the shell with it.
      const child = spawn('wt.exe', ['-d', cwd], { detached: true, stdio: 'ignore' });
      child.on('error', () => {
        spawn('powershell.exe', ['-NoExit', '-Command', `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'`], {
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
  ipcMain.handle(CH.loadSettings, () => loadSettings());
  ipcMain.handle(CH.saveSettings, (_e, s: Settings) => saveSettings(s));
  ipcMain.handle(CH.pickFolder, async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return res.canceled || !res.filePaths[0] ? null : fsService.normalize(res.filePaths[0]);
  });
  ipcMain.handle(CH.appVersion, () => app.getVersion());

  ipcMain.on(CH.windowControl, (_e, action: string) => {
    if (!mainWindow) return;
    if (action === 'minimize') mainWindow.minimize();
    else if (action === 'close') mainWindow.close();
    else if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });

  ipcMain.on(CH.setOpacity, (_e, v: number) => {
    mainWindow?.setOpacity(Math.min(1, Math.max(0.3, v)));
  });
}
