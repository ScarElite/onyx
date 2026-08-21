import { app, autoUpdater, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { appendFileSync } from 'node:fs';
import started from 'electron-squirrel-startup';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';

import { CH, type UpdateStatus } from '../shared/types';
import * as fsService from './fs-service';
import { cancelAllSearches } from './search';
import { registerFsIpc } from './register-fs-ipc';
import { handleOnyxMedia, registerOnyxMediaScheme } from './media-protocol';
import {
  killAllPtys,
  killPty,
  resizePty,
  setPtyCwd,
  setPtySinks,
  startPty,
  writePty,
} from './pty';
import { loadSettings, saveSettings } from './settings';

// Squirrel fires this on install/update shortcut creation; quit immediately.
if (started) app.quit();

/**
 * One Onyx per machine. Two processes would each own a copy of the settings
 * file and clobber the other's saved session on every debounced write — the
 * failure mode being "my tabs keep resetting", which is miserable to diagnose.
 * A second launch focuses the window that already exists instead.
 */
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();

/**
 * Media (images, video, audio, PDF) reaches the renderer over this scheme rather
 * than `file:`. In dev the renderer's origin is the Vite dev server, and
 * Chromium refuses a cross-origin `file:` fetch regardless of CSP — a custom
 * scheme sidesteps that, streams range requests (so video scrubbing works), and
 * keeps a single auditable place where a path becomes readable bytes.
 */
registerOnyxMediaScheme();

let mainWindow: BrowserWindow | null = null;

/* ------------------------------------------------------------------ *
 * Auto-update
 * ------------------------------------------------------------------ */

/**
 * Silent background updates from GitHub Releases, via update.electronjs.org —
 * the same arrangement Conduit uses. `notifyUser: false` suppresses the native
 * restart prompt: a file manager should never throw a modal over a drag you are
 * halfway through. The staged version takes over on the next launch, and the UI
 * offers an explicit "restart now" instead.
 *
 * No-ops in dev (unpackaged) builds and in a losing second instance.
 */
if (gotSingleInstanceLock) {
  updateElectronApp({
    updateSource: { type: UpdateSourceType.ElectronPublicUpdateService, repo: 'ScarElite/onyx' },
    notifyUser: false,
  });
  diag(`launch v${app.getVersion()} packaged=${app.isPackaged}`);
}

/**
 * Leave a trail on disk for the one bug that is otherwise undebuggable: a
 * machine that silently "never updates". Nothing else in Onyx logs, because
 * nothing else fails invisibly on someone else's computer.
 */
function diag(msg: string): void {
  try {
    appendFileSync(path.join(app.getPath('temp'), 'onyx-diag.log'), `${new Date().toISOString()} ${msg}
`);
  } catch {
    /* never let logging break startup */
  }
}

let updateStatus: UpdateStatus = { phase: app.isPackaged ? 'idle' : 'unsupported' };

function setUpdateStatus(next: UpdateStatus): void {
  updateStatus = next;
  diag(`update: ${next.phase}${next.version ? ` v${next.version}` : ''} ${next.message ?? ''}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(CH.updateStatus, next);
  }
}

// updateElectronApp owns the schedule; these listeners just observe the shared
// autoUpdater singleton so the title bar can show what it is doing.
if (gotSingleInstanceLock && app.isPackaged) {
  autoUpdater.on('checking-for-update', () => setUpdateStatus({ phase: 'checking' }));
  autoUpdater.on('update-available', () => setUpdateStatus({ phase: 'downloading' }));
  autoUpdater.on('update-not-available', () => setUpdateStatus({ phase: 'uptodate' }));
  autoUpdater.on('update-downloaded', (_e, _notes, releaseName) =>
    setUpdateStatus({ phase: 'ready', version: releaseName || undefined }),
  );
  autoUpdater.on('error', (err) =>
    setUpdateStatus({ phase: 'error', message: err?.message || 'update failed' }),
  );
}

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
      // ws: covers Vite HMR and the local brain socket in dev.
      "connect-src 'self' ws: http://localhost:* http://127.0.0.1:* onyx-media:",
    ].join('; ');
  }
  // Loopback only: "Ask V" talks to the brain on 127.0.0.1. Nothing here opens
  // a socket to anywhere off this machine.
  return [
    ...common,
    "script-src 'self'",
    "connect-src 'self' onyx-media: ws://127.0.0.1:* ws://localhost:*",
  ].join('; ');
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
    killAllPtys();
  });

  mainWindow.on('closed', () => {
    fsService.closeAllWatchers();
    cancelAllSearches();
    killAllPtys();
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
  handleOnyxMedia();

  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Someone launched Onyx again (Start menu, a shortcut, "open folder in Onyx").
// Surface the window we already have rather than starting a rival process.
app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ------------------------------------------------------------------ *
 * IPC
 * ------------------------------------------------------------------ */

function registerIpc(): void {
  // Everything the embeddable <Explorer/> needs — reading, watching, file ops,
  // clipboard, analysis, drag-out, settings. Shared verbatim with V's Hub, which
  // calls the same function with its own window and settings store.
  registerFsIpc({
    ipcMain,
    send: (channel, ...args) => mainWindow?.webContents.send(channel, ...args),
    getWindow: () => mainWindow,
    loadSettings,
    saveSettings,
  });

  // Push channels the app owns on its own — the pty dock is not part of FsApi.
  setPtySinks({
    onData: (id, chunk) => mainWindow?.webContents.send(CH.ptyData, id, chunk),
    onExit: (id, code) => mainWindow?.webContents.send(CH.ptyExit, id, code),
    onCwd: (id, cwd) => mainWindow?.webContents.send(CH.ptyCwd, id, cwd),
  });

  // --- terminal dock ---
  ipcMain.on(CH.ptyStart, (_e, id: string, cwd: string, cols: number, rows: number, shell?: string) =>
    void startPty(id, cwd, cols, rows, shell || undefined),
  );
  ipcMain.on(CH.ptyWrite, (_e, id: string, data: string) => writePty(id, data));
  ipcMain.on(CH.ptyResize, (_e, id: string, cols: number, rows: number) => resizePty(id, cols, rows));
  ipcMain.on(CH.ptyKill, (_e, id: string) => killPty(id));
  ipcMain.on(CH.ptySetCwd, (_e, id: string, cwd: string) => setPtyCwd(id, cwd));

  // --- auto-update ---
  ipcMain.handle(CH.checkForUpdate, () => {
    if (!app.isPackaged) return updateStatus; // dev build: 'unsupported'
    // Don't stack a second check on top of one already running (ours or the
    // scheduled one) — autoUpdater is a singleton and would error.
    if (updateStatus.phase !== 'checking' && updateStatus.phase !== 'downloading') {
      try {
        autoUpdater.checkForUpdates();
      } catch (e) {
        setUpdateStatus({
          phase: 'error',
          message: e instanceof Error ? e.message : 'update check failed',
        });
      }
    }
    return updateStatus;
  });

  ipcMain.on(CH.restartToUpdate, () => {
    // Only meaningful once a downloaded update is staged. quitAndInstall exits
    // the app, swaps in the new version, and relaunches it.
    if (updateStatus.phase === 'ready') {
      diag('update: quitAndInstall');
      autoUpdater.quitAndInstall();
    }
  });

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
