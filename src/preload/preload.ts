import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  CH,
  type ConflictPolicy,
  type DirListing,
  type DriveInfo,
  type FsEvent,
  type GitStatus,
  type OnyxBridge,
  type OpProgress,
  type OpResult,
  type Place,
  type PreviewPayload,
  type SearchHit,
  type SearchQuery,
  type Settings,
  type UpdateStatus,
  type WindowControlAction,
} from '../shared/types';

/**
 * The entire IPC contract, and the only thing the renderer can reach. Every
 * method here is a thin pass-through: no logic lives in the preload, so there is
 * exactly one place (main) where a path is validated.
 *
 * Every `on*` subscription returns its own unsubscribe function — React effects
 * mount and unmount constantly, and a bridge that leaks listeners will quietly
 * turn into a memory leak plus duplicate handler calls.
 */
function subscribe<A extends unknown[]>(
  channel: string,
  cb: (...args: A) => void,
): () => void {
  const handler = (_e: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...(args as A));
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const bridge: OnyxBridge = {
  // --- reading ---
  readDir: (p) => ipcRenderer.invoke(CH.readDir, p) as Promise<DirListing>,
  drives: () => ipcRenderer.invoke(CH.drives) as Promise<DriveInfo[]>,
  homeDir: () => ipcRenderer.invoke(CH.homeDir) as Promise<string>,
  knownFolders: () => ipcRenderer.invoke(CH.knownFolders) as Promise<Place[]>,
  resolvePath: (input, base) =>
    ipcRenderer.invoke(CH.resolvePath, input, base) as Promise<string | null>,
  parentOf: (p) => ipcRenderer.invoke(CH.parentOf, p) as Promise<string | null>,

  // --- watching ---
  watch: (p) => ipcRenderer.send(CH.watch, p),
  unwatch: (p) => ipcRenderer.send(CH.unwatch, p),
  onFsEvent: (cb: (ev: FsEvent) => void) => subscribe<[FsEvent]>(CH.fsEvent, cb),

  // --- mutating ---
  open: (p) => ipcRenderer.invoke(CH.open, p) as Promise<OpResult>,
  revealInExplorer: (p) => ipcRenderer.invoke(CH.reveal, p) as Promise<OpResult>,
  openTerminalAt: (p) => ipcRenderer.invoke(CH.openTerminal, p) as Promise<OpResult>,
  copy: (srcs, dest, policy: ConflictPolicy) =>
    ipcRenderer.invoke(CH.copy, srcs, dest, policy) as Promise<OpResult>,
  move: (srcs, dest, policy: ConflictPolicy) =>
    ipcRenderer.invoke(CH.move, srcs, dest, policy) as Promise<OpResult>,
  rename: (p, newName) => ipcRenderer.invoke(CH.rename, p, newName) as Promise<OpResult>,
  renameMany: (pairs) => ipcRenderer.invoke(CH.renameMany, pairs) as Promise<OpResult>,
  remove: (paths, toTrash) => ipcRenderer.invoke(CH.remove, paths, toTrash) as Promise<OpResult>,
  mkdir: (parent, name) => ipcRenderer.invoke(CH.mkdir, parent, name) as Promise<OpResult>,
  newFile: (parent, name) => ipcRenderer.invoke(CH.newFile, parent, name) as Promise<OpResult>,
  undo: () => ipcRenderer.invoke(CH.undo) as Promise<OpResult>,
  undoLabel: () => ipcRenderer.invoke(CH.undoLabel) as Promise<string | null>,
  onOpProgress: (cb: (p: OpProgress) => void) => subscribe<[OpProgress]>(CH.opProgress, cb),

  // --- clipboard ---
  clipboardCopyPaths: (paths) => ipcRenderer.invoke(CH.clipCopy, paths) as Promise<OpResult>,
  clipboardCutPaths: (paths) => ipcRenderer.invoke(CH.clipCut, paths) as Promise<OpResult>,
  clipboardReadPaths: () =>
    ipcRenderer.invoke(CH.clipRead) as Promise<{ paths: string[]; cut: boolean }>,
  copyText: (text) => ipcRenderer.send(CH.copyText, text),

  // --- analysis ---
  preview: (p) => ipcRenderer.invoke(CH.preview, p) as Promise<PreviewPayload>,
  folderSize: (p) => ipcRenderer.invoke(CH.folderSize, p) as Promise<number>,
  gitStatus: (dir) => ipcRenderer.invoke(CH.gitStatus, dir) as Promise<GitStatus | null>,
  search: (q: SearchQuery) => ipcRenderer.send(CH.search, q),
  cancelSearch: (id) => ipcRenderer.send(CH.cancelSearch, id),
  onSearchHit: (cb: (id: string, hit: SearchHit) => void) =>
    subscribe<[string, SearchHit]>(CH.searchHit, cb),
  onSearchDone: (cb: (id: string, truncated: boolean) => void) =>
    subscribe<[string, boolean]>(CH.searchDone, cb),

  // --- drag & drop ---
  // webUtils.getPathForFile is the ONLY way to get a dropped file's real path in
  // Electron 32+: File.path was removed. Must be called in the preload, because
  // webUtils is not exposed to the renderer.
  getPathForFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  },
  startDrag: (paths) => ipcRenderer.send(CH.startDrag, paths),

  // --- app ---
  loadSettings: () => ipcRenderer.invoke(CH.loadSettings) as Promise<Settings>,
  saveSettings: (s) => ipcRenderer.invoke(CH.saveSettings, s) as Promise<void>,
  pickFolder: () => ipcRenderer.invoke(CH.pickFolder) as Promise<string | null>,
  windowControl: (action: WindowControlAction) => ipcRenderer.send(CH.windowControl, action),
  setOpacity: (v) => ipcRenderer.send(CH.setOpacity, v),
  onWindowState: (cb: (maximized: boolean) => void) => subscribe<[boolean]>(CH.windowState, cb),
  getAppVersion: () => ipcRenderer.invoke(CH.appVersion) as Promise<string>,

  // --- auto-update ---
  checkForUpdate: () => ipcRenderer.invoke(CH.checkForUpdate) as Promise<UpdateStatus>,
  onUpdateStatus: (cb: (status: UpdateStatus) => void) =>
    subscribe<[UpdateStatus]>(CH.updateStatus, cb),
  restartToUpdate: () => ipcRenderer.send(CH.restartToUpdate),
};

contextBridge.exposeInMainWorld('onyx', bridge);
