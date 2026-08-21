"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const types = require("./onyx-shared.cjs");
function subscribe(channel, cb) {
  const handler = (_e, ...args) => cb(...args);
  electron.ipcRenderer.on(channel, handler);
  return () => {
    electron.ipcRenderer.removeListener(channel, handler);
  };
}
function exposeOnyxBridge() {
  const bridge = {
    // --- reading ---
    readDir: (p) => electron.ipcRenderer.invoke(types.CH.readDir, p),
    drives: () => electron.ipcRenderer.invoke(types.CH.drives),
    homeDir: () => electron.ipcRenderer.invoke(types.CH.homeDir),
    knownFolders: () => electron.ipcRenderer.invoke(types.CH.knownFolders),
    resolvePath: (input, base) => electron.ipcRenderer.invoke(types.CH.resolvePath, input, base),
    parentOf: (p) => electron.ipcRenderer.invoke(types.CH.parentOf, p),
    // --- watching ---
    watch: (p) => electron.ipcRenderer.send(types.CH.watch, p),
    unwatch: (p) => electron.ipcRenderer.send(types.CH.unwatch, p),
    onFsEvent: (cb) => subscribe(types.CH.fsEvent, cb),
    // --- mutating ---
    open: (p) => electron.ipcRenderer.invoke(types.CH.open, p),
    revealInExplorer: (p) => electron.ipcRenderer.invoke(types.CH.reveal, p),
    openTerminalAt: (p) => electron.ipcRenderer.invoke(types.CH.openTerminal, p),
    conflicts: (srcs, dest) => electron.ipcRenderer.invoke(types.CH.conflicts, srcs, dest),
    copy: (srcs, dest, policy) => electron.ipcRenderer.invoke(types.CH.copy, srcs, dest, policy),
    move: (srcs, dest, policy) => electron.ipcRenderer.invoke(types.CH.move, srcs, dest, policy),
    rename: (p, newName) => electron.ipcRenderer.invoke(types.CH.rename, p, newName),
    renameMany: (pairs) => electron.ipcRenderer.invoke(types.CH.renameMany, pairs),
    remove: (paths, toTrash) => electron.ipcRenderer.invoke(types.CH.remove, paths, toTrash),
    mkdir: (parent, name) => electron.ipcRenderer.invoke(types.CH.mkdir, parent, name),
    newFile: (parent, name) => electron.ipcRenderer.invoke(types.CH.newFile, parent, name),
    undo: () => electron.ipcRenderer.invoke(types.CH.undo),
    undoLabel: () => electron.ipcRenderer.invoke(types.CH.undoLabel),
    onOpProgress: (cb) => subscribe(types.CH.opProgress, cb),
    // --- clipboard ---
    clipboardCopyPaths: (paths) => electron.ipcRenderer.invoke(types.CH.clipCopy, paths),
    clipboardCutPaths: (paths) => electron.ipcRenderer.invoke(types.CH.clipCut, paths),
    clipboardReadPaths: () => electron.ipcRenderer.invoke(types.CH.clipRead),
    copyText: (text) => electron.ipcRenderer.send(types.CH.copyText, text),
    // --- analysis ---
    preview: (p) => electron.ipcRenderer.invoke(types.CH.preview, p),
    fileIcons: (items, size) => electron.ipcRenderer.invoke(types.CH.fileIcons, items, size),
    folderSize: (p) => electron.ipcRenderer.invoke(types.CH.folderSize, p),
    gitStatus: (dir) => electron.ipcRenderer.invoke(types.CH.gitStatus, dir),
    search: (q) => electron.ipcRenderer.send(types.CH.search, q),
    cancelSearch: (id) => electron.ipcRenderer.send(types.CH.cancelSearch, id),
    onSearchHit: (cb) => subscribe(types.CH.searchHit, cb),
    onSearchDone: (cb) => subscribe(types.CH.searchDone, cb),
    // --- drag & drop ---
    // webUtils.getPathForFile is the ONLY way to get a dropped file's real path in
    // Electron 32+: File.path was removed. Must be called in the preload, because
    // webUtils is not exposed to the renderer.
    getPathForFile: (file) => {
      try {
        return electron.webUtils.getPathForFile(file);
      } catch {
        return "";
      }
    },
    startDrag: (paths) => electron.ipcRenderer.send(types.CH.startDrag, paths),
    // --- app ---
    loadSettings: () => electron.ipcRenderer.invoke(types.CH.loadSettings),
    saveSettings: (s) => electron.ipcRenderer.invoke(types.CH.saveSettings, s),
    pickFolder: () => electron.ipcRenderer.invoke(types.CH.pickFolder),
    windowControl: (action) => electron.ipcRenderer.send(types.CH.windowControl, action),
    setOpacity: (v) => electron.ipcRenderer.send(types.CH.setOpacity, v),
    onWindowState: (cb) => subscribe(types.CH.windowState, cb),
    getAppVersion: () => electron.ipcRenderer.invoke(types.CH.appVersion),
    // --- terminal dock ---
    startPty: (id, cwd, cols, rows, shell) => electron.ipcRenderer.send(types.CH.ptyStart, id, cwd, cols, rows, shell),
    writePty: (id, data) => electron.ipcRenderer.send(types.CH.ptyWrite, id, data),
    resizePty: (id, cols, rows) => electron.ipcRenderer.send(types.CH.ptyResize, id, cols, rows),
    killPty: (id) => electron.ipcRenderer.send(types.CH.ptyKill, id),
    setPtyCwd: (id, cwd) => electron.ipcRenderer.send(types.CH.ptySetCwd, id, cwd),
    onPtyData: (cb) => subscribe(types.CH.ptyData, cb),
    onPtyExit: (cb) => subscribe(types.CH.ptyExit, cb),
    onPtyCwd: (cb) => subscribe(types.CH.ptyCwd, cb),
    // --- auto-update ---
    checkForUpdate: () => electron.ipcRenderer.invoke(types.CH.checkForUpdate),
    onUpdateStatus: (cb) => subscribe(types.CH.updateStatus, cb),
    restartToUpdate: () => electron.ipcRenderer.send(types.CH.restartToUpdate)
  };
  electron.contextBridge.exposeInMainWorld("onyx", bridge);
}
exports.exposeOnyxBridge = exposeOnyxBridge;
