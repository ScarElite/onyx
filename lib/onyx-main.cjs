"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const node_child_process = require("node:child_process");
const types = require("./onyx-shared.cjs");
const node_fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const node_util = require("node:util");
const node_crypto = require("node:crypto");
const node_url = require("node:url");
const execFileAsync$1 = node_util.promisify(node_child_process.execFile);
function normalize(p) {
  let n = path.win32.normalize(String(p).trim());
  if (/^[a-zA-Z]:$/.test(n)) n = `${n}\\`;
  if (n.length > 3 && n.endsWith("\\") && !isRoot(n)) n = n.slice(0, -1);
  return n;
}
function isRoot(p) {
  return /^[a-zA-Z]:\\$/.test(p) || /^\\\\[^\\]+\\[^\\]+\\?$/.test(p);
}
function isAbsolute(p) {
  return path.win32.isAbsolute(p);
}
function parentOf(p) {
  const n = normalize(p);
  if (isRoot(n)) return null;
  const parent = normalize(path.win32.dirname(n));
  return parent === n ? null : parent;
}
const CLOUD_ROOTS = [
  process.env.OneDrive,
  process.env.OneDriveConsumer,
  process.env.OneDriveCommercial
].filter((v) => !!v).map((v) => normalize(v).toLowerCase());
function isCloudPath(p) {
  const lower = normalize(p).toLowerCase();
  return CLOUD_ROOTS.some((root) => lower === root || lower.startsWith(`${root}\\`));
}
const SYSTEM_NAMES = new Set(
  [
    "$recycle.bin",
    "system volume information",
    "pagefile.sys",
    "hiberfil.sys",
    "swapfile.sys",
    "dumpstack.log",
    "dumpstack.log.tmp",
    "config.msi",
    "recovery",
    "msocache",
    "documents and settings",
    "desktop.ini",
    "thumbs.db",
    "$windows.~bt",
    "$windows.~ws",
    "onedrivetemp",
    "system.sav"
  ].map((s) => s.toLowerCase())
);
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (; ; ) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}
function describeError(e) {
  const err = e;
  switch (err?.code) {
    case "EPERM":
    case "EACCES":
      return "Access denied";
    case "ENOENT":
      return "Folder not found";
    case "ENOTDIR":
      return "Not a folder";
    case "EBUSY":
      return "In use by another program";
    case "ENOTEMPTY":
      return "Folder is not empty";
    case "EEXIST":
      return "Already exists";
    case "EINVAL":
      return "Invalid path";
    case "EMFILE":
    case "ENFILE":
      return "Too many open files";
    default:
      return err?.message || String(e);
  }
}
function extOf(name, isDir) {
  if (isDir) return "";
  const e = path.win32.extname(name);
  return e ? e.slice(1).toLowerCase() : "";
}
async function toEntry(dir, name, dirent) {
  const full = normalize(path.win32.join(dir, name));
  const lower = name.toLowerCase();
  const hidden = name.startsWith(".") || SYSTEM_NAMES.has(lower);
  const system = SYSTEM_NAMES.has(lower);
  let kind = dirent.isDirectory() ? "dir" : "file";
  if (dirent.isSymbolicLink()) {
    kind = "symlink";
    try {
      const target = await node_fs.promises.stat(full);
      if (target.isDirectory()) kind = "junction";
    } catch {
    }
  }
  const base = {
    name,
    path: full,
    kind,
    size: 0,
    modified: 0,
    created: 0,
    hidden,
    system,
    readonly: false,
    placeholder: false,
    inaccessible: false,
    ext: extOf(name, kind === "dir")
  };
  try {
    const st = await node_fs.promises.lstat(full);
    base.size = kind === "dir" ? 0 : st.size;
    base.modified = st.mtimeMs;
    base.created = st.birthtimeMs || st.ctimeMs;
    base.readonly = (st.mode & 128) === 0;
    base.placeholder = kind === "file" && isCloudPath(full);
  } catch {
    base.inaccessible = true;
  }
  return base;
}
async function readDir(dirPath) {
  const dir = normalize(dirPath);
  if (!isAbsolute(dir)) return { path: dir, entries: [], error: "Not an absolute path" };
  let dirents;
  try {
    dirents = await node_fs.promises.readdir(dir, { withFileTypes: true });
  } catch (e) {
    return { path: dir, entries: [], error: describeError(e) };
  }
  const entries = await mapPool(dirents, 48, (d) => toEntry(dir, d.name, d));
  const failed = entries.filter((e) => e.inaccessible).length;
  const listing = { path: dir, entries };
  if (failed > 0) {
    listing.warning = `${failed} item${failed === 1 ? "" : "s"} could not be read`;
  }
  const gitRoot = await findGitRoot(dir);
  if (gitRoot) listing.gitRoot = gitRoot;
  return listing;
}
async function findGitRoot(dir) {
  let cur = normalize(dir);
  for (; ; ) {
    try {
      await node_fs.promises.stat(path.win32.join(cur, ".git"));
      return cur;
    } catch {
    }
    const parent = parentOf(cur);
    if (!parent) return void 0;
    cur = parent;
  }
}
const DRIVE_TYPE_LABEL = {
  2: "Removable Disk",
  3: "Local Disk",
  4: "Network Drive",
  5: "CD Drive",
  6: "RAM Disk"
};
let driveCache = null;
async function drives() {
  if (driveCache && Date.now() - driveCache.at < 5e3) return driveCache.drives;
  let result = [];
  try {
    const { stdout } = await execFileAsync$1(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,VolumeName,Size,FreeSpace,DriveType | ConvertTo-Json -Compress"
      ],
      { windowsHide: true, timeout: 8e3, maxBuffer: 1024 * 1024 }
    );
    const parsed = JSON.parse(stdout.trim() || "[]");
    const list = Array.isArray(parsed) ? parsed : [parsed];
    result = list.filter((d) => !!d.DeviceID).map((d) => {
      const total = Number(d.Size ?? 0) || 0;
      const free = Number(d.FreeSpace ?? 0) || 0;
      const letter = String(d.DeviceID);
      return {
        letter,
        path: `${letter}\\`,
        label: d.VolumeName || DRIVE_TYPE_LABEL[d.DriveType ?? 3] || "Drive",
        total,
        free,
        // Size comes back null for an empty card reader or ejected disc.
        ready: total > 0
      };
    });
  } catch {
    result = [];
  }
  if (result.length === 0) result = await probeDrives();
  driveCache = { at: Date.now(), drives: result };
  return result;
}
async function probeDrives() {
  const found = [];
  for (let i = 0; i < 26; i++) {
    const letter = `${String.fromCharCode(65 + i)}:`;
    const root = `${letter}\\`;
    try {
      await node_fs.promises.access(root);
    } catch {
      continue;
    }
    let total = 0;
    let free = 0;
    try {
      const st = await node_fs.promises.statfs(root);
      total = Number(st.blocks) * Number(st.bsize);
      free = Number(st.bavail) * Number(st.bsize);
    } catch {
    }
    found.push({ letter, path: root, label: "Drive", total, free, ready: total > 0 });
  }
  return found;
}
function homeDir() {
  return normalize(electron.app.getPath("home"));
}
function knownFolders() {
  const wanted = [
    { name: "Desktop", key: "desktop" },
    { name: "Downloads", key: "downloads" },
    { name: "Documents", key: "documents" },
    { name: "Pictures", key: "pictures" },
    { name: "Music", key: "music" },
    { name: "Videos", key: "videos" }
  ];
  const out = [];
  for (const { name, key } of wanted) {
    try {
      out.push({ name, path: normalize(electron.app.getPath(key)) });
    } catch {
    }
  }
  return out;
}
async function resolvePath(input, base) {
  let s = String(input).trim();
  if (!s) return null;
  if (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1);
  }
  if (s === "~" || s.startsWith("~\\") || s.startsWith("~/")) {
    s = path.win32.join(os.homedir(), s.slice(1));
  }
  s = s.replace(/%([^%]+)%/g, (m, name) => process.env[name] ?? m);
  const candidate = path.win32.isAbsolute(s) ? normalize(s) : normalize(path.win32.join(base, s));
  try {
    await node_fs.promises.stat(candidate);
    return candidate;
  } catch {
    return null;
  }
}
const watchers = /* @__PURE__ */ new Map();
let emit = () => void 0;
function setFsEventSink(fn) {
  emit = fn;
}
function watch(dirPath) {
  const dir = normalize(dirPath);
  const existing = watchers.get(dir);
  if (existing) {
    existing.refs++;
    return;
  }
  let watcher;
  try {
    watcher = node_fs.watch(dir, { persistent: true, recursive: false });
  } catch {
    return;
  }
  const rec = { watcher, refs: 1, timer: null };
  watcher.on("change", (_type, filename) => {
    if (rec.timer) return;
    rec.timer = setTimeout(() => {
      rec.timer = null;
      const name = typeof filename === "string" ? filename : "";
      emit({
        kind: "change",
        dir,
        path: name ? normalize(path.win32.join(dir, name)) : dir
      });
    }, 120);
  });
  watcher.on("error", () => closeWatcher(dir));
  watchers.set(dir, rec);
}
function unwatch(dirPath) {
  const dir = normalize(dirPath);
  const rec = watchers.get(dir);
  if (!rec) return;
  rec.refs--;
  if (rec.refs <= 0) closeWatcher(dir);
}
function closeWatcher(dir) {
  const rec = watchers.get(dir);
  if (!rec) return;
  if (rec.timer) clearTimeout(rec.timer);
  try {
    rec.watcher.close();
  } catch {
  }
  watchers.delete(dir);
}
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const ILLEGAL_NAME = /[<>:"/\\|?*\u0000-\u001f]/;
function validateName(name) {
  const n = name.trim();
  if (!n) return "Name cannot be empty";
  if (n === "." || n === "..") return "Reserved name";
  if (ILLEGAL_NAME.test(n)) return 'Name cannot contain \\ / : * ? " < > |';
  if (RESERVED.test(n)) return `"${n}" is a reserved Windows name`;
  if (n.endsWith(".") || n.endsWith(" ")) return "Name cannot end with a space or a period";
  if (n.length > 255) return "Name is too long";
  return null;
}
function assertUsable(p) {
  const n = normalize(p);
  if (!isAbsolute(n)) throw new Error(`Refusing to operate on a non-absolute path: ${p}`);
}
function assertDeletable(p) {
  const n = normalize(p);
  assertUsable(n);
  if (isRoot(n)) throw new Error("Refusing to delete a drive root");
  const home = normalize(process.env.USERPROFILE || "");
  if (home && n.toLowerCase() === home.toLowerCase()) {
    throw new Error("Refusing to delete the user profile folder");
  }
  const parent = parentOf(n);
  if (parent && isRoot(parent) && /^(windows|program files|program files \(x86\)|users)$/i.test(path.win32.basename(n))) {
    throw new Error(`Refusing to delete a protected system folder: ${path.win32.basename(n)}`);
  }
}
function isInside(child, parent) {
  const c = normalize(child).toLowerCase();
  const p = normalize(parent).toLowerCase();
  return c === p || c.startsWith(p.endsWith("\\") ? p : `${p}\\`);
}
const undoStack = [];
const UNDO_LIMIT = 50;
function journal(rec) {
  undoStack.push(rec);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}
function undoLabel() {
  const top = undoStack[undoStack.length - 1];
  return top ? top.label : null;
}
async function undo() {
  const rec = undoStack.pop();
  if (!rec) return { ok: false, error: "Nothing to undo" };
  if (!rec.reversible) {
    return {
      ok: false,
      error: rec.note ?? `"${rec.label}" cannot be undone`,
      undoLabel: undoLabel() ?? void 0
    };
  }
  const failures = [];
  const affected = [];
  for (const step of [...rec.inverse].reverse()) {
    try {
      if (step.t === "moveBack") {
        await node_fs.promises.mkdir(path.win32.dirname(step.to), { recursive: true });
        await rename(step.from, step.to);
        affected.push(step.to);
      } else {
        await electron.shell.trashItem(step.path);
      }
    } catch (e) {
      failures.push({ path: step.t === "moveBack" ? step.from : step.path, error: describeError(e) });
    }
  }
  return {
    ok: failures.length === 0,
    error: failures.length ? `Undo partially failed (${failures.length})` : void 0,
    affected,
    failures: failures.length ? failures : void 0,
    undoLabel: undoLabel() ?? void 0
  };
}
let progressSink = () => void 0;
function setProgressSink(fn) {
  progressSink = fn;
}
function report(id, kind, done, total, current) {
  progressSink({
    id,
    kind,
    fraction: total > 0 ? done / total : -1,
    current,
    done: done >= total
  });
}
async function exists(p) {
  try {
    await node_fs.promises.lstat(p);
    return true;
  } catch {
    return false;
  }
}
async function uniquePath(target) {
  if (!await exists(target)) return target;
  const dir = path.win32.dirname(target);
  const base = path.win32.basename(target);
  const ext = path.win32.extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  for (let i = 2; i < 1e4; i++) {
    const candidate = normalize(path.win32.join(dir, `${stem} (${i})${ext}`));
    if (!await exists(candidate)) return candidate;
  }
  throw new Error("Could not find an unused name");
}
async function resolveTarget(destDir, name, policy) {
  const target = normalize(path.win32.join(destDir, name));
  if (!await exists(target)) return { target, overwrite: false };
  switch (policy) {
    case "skip":
      return null;
    case "overwrite":
      return { target, overwrite: true };
    default:
      return { target: await uniquePath(target), overwrite: false };
  }
}
async function rename(from, to) {
  try {
    await node_fs.promises.rename(from, to);
  } catch (e) {
    if (e.code !== "EXDEV") throw e;
    await node_fs.promises.cp(from, to, { recursive: true, force: true, errorOnExist: false });
    await node_fs.promises.rm(from, { recursive: true, force: true });
  }
}
async function conflicts(srcs, destDirRaw) {
  const destDir = normalize(destDirRaw);
  const hits = [];
  for (const raw of srcs) {
    const name = path.win32.basename(normalize(raw));
    if (await exists(normalize(path.win32.join(destDir, name)))) hits.push(name);
  }
  return hits;
}
async function copy(srcs, destDirRaw, policy) {
  const destDir = normalize(destDirRaw);
  const id = node_crypto.randomUUID();
  const failures = [];
  const created = [];
  try {
    assertUsable(destDir);
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
  let done = 0;
  for (const raw of srcs) {
    const src = normalize(raw);
    report(id, "copy", done, srcs.length, src);
    try {
      assertUsable(src);
      if (isInside(destDir, src)) throw new Error("Cannot copy a folder into itself");
      const resolved = await resolveTarget(destDir, path.win32.basename(src), policy);
      if (!resolved) {
        done++;
        continue;
      }
      await node_fs.promises.cp(src, resolved.target, {
        recursive: true,
        force: resolved.overwrite,
        errorOnExist: !resolved.overwrite
      });
      created.push(resolved.target);
    } catch (e) {
      failures.push({ path: src, error: describeError(e) });
    }
    done++;
    report(id, "copy", done, srcs.length, src);
  }
  if (created.length) {
    journal({
      label: `Copy ${created.length} item${created.length === 1 ? "" : "s"}`,
      inverse: created.map((p) => ({ t: "discard", path: p })),
      reversible: true
    });
  }
  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to copy` : void 0,
    affected: created,
    failures: failures.length ? failures : void 0,
    undoLabel: undoLabel() ?? void 0
  };
}
async function move(srcs, destDirRaw, policy) {
  const destDir = normalize(destDirRaw);
  const id = node_crypto.randomUUID();
  const failures = [];
  const moved = [];
  try {
    assertUsable(destDir);
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
  let done = 0;
  for (const raw of srcs) {
    const src = normalize(raw);
    report(id, "move", done, srcs.length, src);
    try {
      assertUsable(src);
      if (isInside(destDir, src)) throw new Error("Cannot move a folder into itself");
      if (normalize(path.win32.dirname(src)).toLowerCase() === destDir.toLowerCase()) {
        done++;
        continue;
      }
      const resolved = await resolveTarget(destDir, path.win32.basename(src), policy);
      if (!resolved) {
        done++;
        continue;
      }
      if (resolved.overwrite) await node_fs.promises.rm(resolved.target, { recursive: true, force: true });
      await rename(src, resolved.target);
      moved.push({ from: src, to: resolved.target });
    } catch (e) {
      failures.push({ path: src, error: describeError(e) });
    }
    done++;
    report(id, "move", done, srcs.length, src);
  }
  if (moved.length) {
    journal({
      label: `Move ${moved.length} item${moved.length === 1 ? "" : "s"}`,
      inverse: moved.map((m) => ({ t: "moveBack", from: m.to, to: m.from })),
      reversible: true
    });
  }
  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to move` : void 0,
    affected: moved.map((m) => m.to),
    failures: failures.length ? failures : void 0,
    undoLabel: undoLabel() ?? void 0
  };
}
async function renameOne(rawPath, newName) {
  const src = normalize(rawPath);
  const bad = validateName(newName);
  if (bad) return { ok: false, error: bad };
  try {
    assertUsable(src);
    const target = normalize(path.win32.join(path.win32.dirname(src), newName.trim()));
    if (target.toLowerCase() === src.toLowerCase()) {
      await node_fs.promises.rename(src, target);
    } else {
      if (await exists(target)) return { ok: false, error: `"${newName}" already exists` };
      await node_fs.promises.rename(src, target);
    }
    journal({
      label: `Rename to "${path.win32.basename(target)}"`,
      inverse: [{ t: "moveBack", from: target, to: src }],
      reversible: true
    });
    return { ok: true, affected: [target], undoLabel: undoLabel() ?? void 0 };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}
async function renameMany(pairs) {
  const id = node_crypto.randomUUID();
  const failures = [];
  const staged = [];
  for (const p of pairs) {
    const bad = validateName(p.newName);
    if (bad) return { ok: false, error: `"${p.newName}": ${bad}` };
  }
  let done = 0;
  for (const p of pairs) {
    const src = normalize(p.path);
    report(id, "rename", done, pairs.length * 2, src);
    try {
      assertUsable(src);
      const dir = path.win32.dirname(src);
      const temp = normalize(path.win32.join(dir, `.onyx-rename-${node_crypto.randomUUID()}`));
      const final = normalize(path.win32.join(dir, p.newName.trim()));
      await node_fs.promises.rename(src, temp);
      staged.push({ temp, final, original: src });
    } catch (e) {
      failures.push({ path: src, error: describeError(e) });
    }
    done++;
  }
  const completed = [];
  for (const s of staged) {
    report(id, "rename", done, pairs.length * 2, s.final);
    try {
      if (await exists(s.final)) throw new Error(`"${path.win32.basename(s.final)}" already exists`);
      await node_fs.promises.rename(s.temp, s.final);
      completed.push({ from: s.final, to: s.original });
    } catch (e) {
      try {
        await node_fs.promises.rename(s.temp, s.original);
      } catch {
      }
      failures.push({ path: s.original, error: describeError(e) });
    }
    done++;
  }
  report(id, "rename", pairs.length * 2, pairs.length * 2, "");
  if (completed.length) {
    journal({
      label: `Rename ${completed.length} item${completed.length === 1 ? "" : "s"}`,
      inverse: completed.map((c) => ({ t: "moveBack", from: c.from, to: c.to })),
      reversible: true
    });
  }
  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to rename` : void 0,
    affected: completed.map((c) => c.from),
    failures: failures.length ? failures : void 0,
    undoLabel: undoLabel() ?? void 0
  };
}
async function remove(paths, toTrash) {
  const id = node_crypto.randomUUID();
  const failures = [];
  const removed = [];
  let done = 0;
  for (const raw of paths) {
    const p = normalize(raw);
    report(id, toTrash ? "trash" : "delete", done, paths.length, p);
    try {
      assertDeletable(p);
      if (toTrash) await electron.shell.trashItem(p);
      else await node_fs.promises.rm(p, { recursive: true, force: true });
      removed.push(p);
    } catch (e) {
      failures.push({ path: p, error: describeError(e) });
    }
    done++;
    report(id, toTrash ? "trash" : "delete", done, paths.length, p);
  }
  if (removed.length) {
    journal({
      label: `${toTrash ? "Delete" : "Permanently delete"} ${removed.length} item${removed.length === 1 ? "" : "s"}`,
      inverse: [],
      reversible: false,
      note: toTrash ? `${removed.length} item(s) are in the Recycle Bin — restore them from there` : "Permanently deleted items cannot be recovered"
    });
  }
  return {
    ok: failures.length === 0,
    error: failures.length ? `${failures.length} item(s) failed to delete` : void 0,
    affected: removed,
    failures: failures.length ? failures : void 0,
    undoLabel: undoLabel() ?? void 0
  };
}
async function mkdir(parentRaw, name) {
  const bad = validateName(name);
  if (bad) return { ok: false, error: bad };
  const parent = normalize(parentRaw);
  try {
    assertUsable(parent);
    const target = normalize(path.win32.join(parent, name.trim()));
    if (await exists(target)) return { ok: false, error: `"${name}" already exists` };
    await node_fs.promises.mkdir(target);
    journal({
      label: `New folder "${name.trim()}"`,
      inverse: [{ t: "discard", path: target }],
      reversible: true
    });
    return { ok: true, affected: [target], undoLabel: undoLabel() ?? void 0 };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}
async function newFile(parentRaw, name) {
  const bad = validateName(name);
  if (bad) return { ok: false, error: bad };
  const parent = normalize(parentRaw);
  try {
    assertUsable(parent);
    const target = normalize(path.win32.join(parent, name.trim()));
    if (await exists(target)) return { ok: false, error: `"${name}" already exists` };
    await node_fs.promises.writeFile(target, "", { flag: "wx" });
    journal({
      label: `New file "${name.trim()}"`,
      inverse: [{ t: "discard", path: target }],
      reversible: true
    });
    return { ok: true, affected: [target], undoLabel: undoLabel() ?? void 0 };
  } catch (e) {
    return { ok: false, error: describeError(e) };
  }
}
const TEXT_CAP = 256 * 1024;
const IMAGE_EXT = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "avif", "svg"]);
const VIDEO_EXT = /* @__PURE__ */ new Set(["mp4", "webm", "ogv", "m4v", "mov"]);
const AUDIO_EXT = /* @__PURE__ */ new Set(["mp3", "wav", "ogg", "oga", "flac", "m4a", "aac", "opus"]);
const LANG = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
  css: "css",
  scss: "scss",
  html: "html",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  ini: "ini",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  sh: "bash",
  bash: "bash",
  ps1: "powershell",
  psm1: "powershell",
  sql: "sql",
  lua: "lua",
  swift: "swift",
  kt: "kotlin",
  r: "r",
  pl: "perl",
  vim: "vim",
  dockerfile: "dockerfile"
};
const TEXT_NAMES = /* @__PURE__ */ new Set([
  "readme",
  "license",
  "licence",
  "changelog",
  "authors",
  "contributing",
  "makefile",
  "dockerfile",
  "procfile",
  "gemfile",
  "rakefile",
  "notice",
  ".gitignore",
  ".gitattributes",
  ".npmrc",
  ".editorconfig",
  ".env",
  ".eslintrc",
  ".prettierrc",
  ".babelrc",
  ".nvmrc",
  ".python-version"
]);
const TEXT_EXT = /* @__PURE__ */ new Set([
  ...Object.keys(LANG),
  "txt",
  "log",
  "csv",
  "tsv",
  "gitignore",
  "gitattributes",
  "env",
  "lock",
  "cfg",
  "conf",
  "properties",
  "patch",
  "diff",
  "srt",
  "vtt",
  "tex",
  "bib"
]);
function classify(name, ext) {
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (TEXT_EXT.has(ext)) return "text";
  if (!ext && TEXT_NAMES.has(name.toLowerCase())) return "text";
  return "binary";
}
function looksBinary$1(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}
async function preview(rawPath) {
  const p = normalize(rawPath);
  const base = { path: p, kind: "none", size: 0, modified: 0 };
  let st;
  try {
    st = await node_fs.promises.stat(p);
  } catch (e) {
    return { ...base, error: describeError(e) };
  }
  base.size = st.size;
  base.modified = st.mtimeMs;
  if (st.isDirectory()) {
    try {
      const items = await node_fs.promises.readdir(p, { withFileTypes: true });
      let dirs = 0;
      let files = 0;
      for (const d of items) d.isDirectory() ? dirs++ : files++;
      return { ...base, kind: "dir", childCount: { dirs, files } };
    } catch (e) {
      return { ...base, kind: "dir", error: describeError(e) };
    }
  }
  const name = path.win32.basename(p);
  const ext = (path.win32.extname(name).slice(1) || "").toLowerCase();
  const kind = classify(name, ext);
  try {
    switch (kind) {
      case "image":
      case "pdf":
      case "video":
      case "audio":
        return { ...base, kind, src: types.mediaUrl(p) };
      case "text": {
        const handle = await node_fs.promises.open(p, "r");
        try {
          const buf = Buffer.alloc(Math.min(st.size, TEXT_CAP));
          const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
          const slice = buf.subarray(0, bytesRead);
          if (looksBinary$1(slice)) return { ...base, kind: "binary" };
          return {
            ...base,
            kind: "text",
            text: slice.toString("utf8"),
            truncated: st.size > TEXT_CAP,
            lang: LANG[ext]
          };
        } finally {
          await handle.close();
        }
      }
      default:
        return { ...base, kind: "binary" };
    }
  } catch (e) {
    return { ...base, kind, error: describeError(e) };
  }
}
const SELF_DRAWING = /* @__PURE__ */ new Set([
  ".exe",
  ".lnk",
  ".ico",
  ".url",
  ".msc",
  ".cpl",
  ".scr",
  ".appref-ms",
  ".msi"
]);
const cache$2 = /* @__PURE__ */ new Map();
const inflight$1 = /* @__PURE__ */ new Map();
const MAX_CONCURRENT = 8;
let active = 0;
const queue = [];
function acquire() {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}
function release() {
  const next = queue.shift();
  if (next) next();
  else active--;
}
function cacheKey(target, isDir, size) {
  if (isDir) return `d|${size}|${target.toLowerCase()}`;
  const ext = path.win32.extname(target).toLowerCase();
  if (!ext || SELF_DRAWING.has(ext)) return `p|${size}|${target.toLowerCase()}`;
  return `e|${size}|${ext}`;
}
async function fileIcon(rawPath, isDir, size = "normal") {
  const target = normalize(rawPath);
  const key = cacheKey(target, isDir, size);
  const hit = cache$2.get(key);
  if (hit !== void 0) return hit;
  const running2 = inflight$1.get(key);
  if (running2) return running2;
  const job = (async () => {
    await acquire();
    try {
      const image = await electron.app.getFileIcon(target, { size });
      if (image.isEmpty()) return null;
      const url = image.toDataURL();
      cache$2.set(key, url);
      return url;
    } catch {
      return null;
    } finally {
      release();
      inflight$1.delete(key);
    }
  })();
  inflight$1.set(key, job);
  return job;
}
async function fileIcons(items, size = "normal") {
  const out = {};
  await Promise.all(
    items.slice(0, 400).map(async (item) => {
      const url = await fileIcon(item.path, item.isDir, size);
      if (url) out[normalize(item.path)] = url;
    })
  );
  return out;
}
const execFileAsync = node_util.promisify(node_child_process.execFile);
const STALE_MS = 2500;
const cache$1 = /* @__PURE__ */ new Map();
function mapXY(x, y) {
  if (x === "R" || y === "R") return "renamed";
  if (x === "D" || y === "D") return "deleted";
  if (x === "A") return "added";
  if (x !== "." && x !== "?") return "modified";
  if (y !== "." && y !== "?") return "modified";
  return "modified";
}
const RANK = {
  conflicted: 6,
  deleted: 5,
  modified: 4,
  renamed: 3,
  added: 2,
  untracked: 1,
  ignored: 0
};
async function gitStatus(dirRaw) {
  const dir = normalize(dirRaw);
  const root = await findGitRoot(dir);
  if (!root) return null;
  const hit = cache$1.get(root);
  if (hit) {
    if (hit.inflight) return hit.inflight;
    if (Date.now() - hit.at < STALE_MS) return hit.status;
  }
  const inflight2 = readStatus(root).then((status) => {
    cache$1.set(root, { at: Date.now(), status });
    return status;
  }).catch(() => {
    cache$1.set(root, { at: Date.now(), status: null });
    return null;
  });
  cache$1.set(root, { at: hit?.at ?? 0, status: hit?.status ?? null, inflight: inflight2 });
  return inflight2;
}
function invalidateGit(dirRaw) {
  const dir = normalize(dirRaw).toLowerCase();
  for (const root of [...cache$1.keys()]) {
    if (dir.startsWith(root.toLowerCase())) cache$1.delete(root);
  }
}
async function readStatus(root) {
  const { stdout } = await execFileAsync(
    "git",
    [
      "status",
      "--porcelain=v2",
      "--branch",
      "-z",
      "--untracked-files=normal",
      // 'traditional' collapses a fully-ignored folder (node_modules) into ONE
      // record instead of listing its 40,000 files.
      "--ignored=traditional"
    ],
    { cwd: root, windowsHide: true, timeout: 15e3, maxBuffer: 32 * 1024 * 1024 }
  );
  const status = {
    root,
    branch: "",
    ahead: 0,
    behind: 0,
    dirty: 0,
    entries: {}
  };
  const fields = stdout.split("\0");
  const files = [];
  for (let i = 0; i < fields.length; i++) {
    const line = fields[i];
    if (!line) continue;
    if (line.startsWith("# ")) {
      const [, key, ...rest] = line.split(" ");
      const value = rest.join(" ");
      if (key === "branch.head") status.branch = value;
      else if (key === "branch.ab") {
        const m = /\+(\d+)\s+-(\d+)/.exec(value);
        if (m) {
          status.ahead = Number(m[1]);
          status.behind = Number(m[2]);
        }
      }
      continue;
    }
    const tag = line[0];
    if (tag === "1") {
      const parts = line.split(" ");
      files.push({ rel: parts.slice(8).join(" "), st: mapXY(parts[1][0], parts[1][1]) });
    } else if (tag === "2") {
      const parts = line.split(" ");
      files.push({ rel: parts.slice(9).join(" "), st: "renamed" });
      i++;
    } else if (tag === "u") {
      const parts = line.split(" ");
      files.push({ rel: parts.slice(10).join(" "), st: "conflicted" });
    } else if (tag === "?") {
      files.push({ rel: line.slice(2), st: "untracked" });
    } else if (tag === "!") {
      files.push({ rel: line.slice(2), st: "ignored" });
    }
  }
  for (const { rel, st } of files) {
    const clean = rel.replace(/\/+$/, "");
    const abs = normalize(path.win32.join(root, clean.replace(/\//g, "\\")));
    assign(status.entries, abs, st);
    if (st !== "ignored") status.dirty++;
    if (st === "ignored") continue;
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
function assign(map, key, st) {
  const existing = map[key];
  if (!existing || RANK[st] > RANK[existing]) map[key] = st;
}
const TTL_MS = 6e4;
const MAX_ENTRIES = 5e5;
const cache = /* @__PURE__ */ new Map();
const inflight = /* @__PURE__ */ new Map();
function folderSize(dirRaw) {
  const dir = normalize(dirRaw);
  const hit = cache.get(dir);
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.size);
  const running2 = inflight.get(dir);
  if (running2) return running2;
  const job = walk(dir).then((size) => {
    cache.set(dir, { at: Date.now(), size });
    return size;
  }).catch(() => 0).finally(() => {
    inflight.delete(dir);
  });
  inflight.set(dir, job);
  return job;
}
function invalidateSize(pathRaw) {
  const p = normalize(pathRaw).toLowerCase();
  for (const key of [...cache.keys()]) {
    const k = key.toLowerCase();
    if (p.startsWith(k) || k.startsWith(p)) cache.delete(key);
  }
}
async function walk(root) {
  let total = 0;
  let seen = 0;
  const queue2 = [root];
  while (queue2.length > 0) {
    const dir = queue2.pop();
    let dirents;
    try {
      dirents = await node_fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const d of dirents) {
      if (++seen > MAX_ENTRIES) return total;
      if (d.isSymbolicLink()) continue;
      const full = path.win32.join(dir, d.name);
      if (d.isDirectory()) {
        queue2.push(full);
        continue;
      }
      try {
        const st = await node_fs.promises.lstat(full);
        total += st.size;
      } catch {
      }
    }
    await new Promise((r) => setImmediate(r));
  }
  return total;
}
const CONTENT_CAP = 4 * 1024 * 1024;
const YIELD_EVERY = 400;
let onHit = () => void 0;
let onDone = () => void 0;
function setSearchSinks(hit, done) {
  onHit = hit;
  onDone = done;
}
const running = /* @__PURE__ */ new Map();
function cancelSearch(id) {
  const rec = running.get(id);
  if (rec) rec.cancelled = true;
}
function matcher(needle, regex, caseSensitive) {
  if (!needle) return () => false;
  if (regex) {
    let re;
    try {
      re = new RegExp(needle, caseSensitive ? "" : "i");
    } catch {
      return () => false;
    }
    return (s) => re.test(s);
  }
  if (caseSensitive) return (s) => s.includes(needle);
  const lower = needle.toLowerCase();
  return (s) => s.toLowerCase().includes(lower);
}
function looksBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}
async function startSearch(q) {
  const state = { cancelled: false };
  running.set(q.id, state);
  const nameMatch = matcher(q.name, q.regex, q.caseSensitive);
  const contentMatch = matcher(q.content, q.regex, q.caseSensitive);
  const wantName = !!q.name;
  const wantContent = !!q.content;
  const queue2 = [normalize(q.root)];
  let hits = 0;
  let seen = 0;
  let truncated = false;
  try {
    while (queue2.length > 0) {
      if (state.cancelled) break;
      const dir = queue2.shift();
      let dirents;
      try {
        dirents = await node_fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const d of dirents) {
        if (state.cancelled) break;
        if (hits >= q.maxHits) {
          truncated = true;
          break;
        }
        const name = d.name;
        if (!q.includeHidden && name.startsWith(".")) continue;
        const full = normalize(path.win32.join(dir, name));
        const isLink = d.isSymbolicLink();
        const isDir = d.isDirectory();
        const kind = isLink ? "symlink" : isDir ? "dir" : "file";
        if (++seen % YIELD_EVERY === 0) await new Promise((r) => setImmediate(r));
        if (wantName && nameMatch(name)) {
          let size = 0;
          let modified = 0;
          try {
            const st = await node_fs.promises.lstat(full);
            size = st.isDirectory() ? 0 : st.size;
            modified = st.mtimeMs;
          } catch {
          }
          onHit(q.id, { path: full, name, dir, kind, size, modified });
          hits++;
        }
        if (isDir && !isLink) {
          queue2.push(full);
          continue;
        }
        if (!wantContent || isLink || isDir) continue;
        try {
          const st = await node_fs.promises.lstat(full);
          if (st.size === 0 || st.size > CONTENT_CAP) continue;
          const buf = await node_fs.promises.readFile(full);
          if (looksBinary(buf)) continue;
          const lines = buf.toString("utf8").split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            if (!contentMatch(lines[i])) continue;
            onHit(q.id, {
              path: full,
              name,
              dir,
              kind,
              size: st.size,
              modified: st.mtimeMs,
              line: lines[i].slice(0, 400),
              lineNo: i + 1
            });
            hits++;
            if (hits >= q.maxHits) {
              truncated = true;
              break;
            }
          }
        } catch {
        }
      }
      if (hits >= q.maxHits) {
        truncated = true;
        break;
      }
    }
  } finally {
    running.delete(q.id);
    onDone(q.id, truncated);
  }
}
let fileClipboard = { paths: [], cut: false };
function registerFsIpc(host) {
  const { ipcMain, send, getWindow } = host;
  setFsEventSink((ev) => {
    invalidateGit(ev.dir);
    invalidateSize(ev.dir);
    send(types.CH.fsEvent, ev);
  });
  setProgressSink((p) => send(types.CH.opProgress, p));
  setSearchSinks(
    (id, hit) => send(types.CH.searchHit, id, hit),
    (id, truncated) => send(types.CH.searchDone, id, truncated)
  );
  ipcMain.handle(types.CH.readDir, (_e, p) => readDir(p));
  ipcMain.handle(types.CH.drives, () => drives());
  ipcMain.handle(types.CH.homeDir, () => homeDir());
  ipcMain.handle(types.CH.knownFolders, () => knownFolders());
  ipcMain.handle(
    types.CH.resolvePath,
    (_e, input, base) => resolvePath(input, base)
  );
  ipcMain.handle(types.CH.parentOf, (_e, p) => parentOf(p));
  ipcMain.on(types.CH.watch, (_e, p) => watch(p));
  ipcMain.on(types.CH.unwatch, (_e, p) => unwatch(p));
  ipcMain.handle(types.CH.open, async (_e, p) => {
    const err = await electron.shell.openPath(normalize(p));
    return err ? { ok: false, error: err } : { ok: true };
  });
  ipcMain.handle(types.CH.reveal, (_e, p) => {
    electron.shell.showItemInFolder(normalize(p));
    return { ok: true };
  });
  ipcMain.handle(types.CH.openTerminal, (_e, p) => {
    const cwd = normalize(p);
    try {
      const child = node_child_process.spawn("wt.exe", ["-d", cwd], { detached: true, stdio: "ignore" });
      child.on("error", () => {
        const quoted = cwd.replace(/'/g, "''");
        node_child_process.spawn("powershell.exe", ["-NoExit", "-Command", `Set-Location -LiteralPath '${quoted}'`], {
          detached: true,
          stdio: "ignore",
          cwd
        }).unref();
      });
      child.unref();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });
  ipcMain.handle(types.CH.conflicts, (_e, srcs, dest) => conflicts(srcs, dest));
  ipcMain.handle(
    types.CH.copy,
    (_e, srcs, dest, policy) => copy(srcs, dest, policy)
  );
  ipcMain.handle(
    types.CH.move,
    (_e, srcs, dest, policy) => move(srcs, dest, policy)
  );
  ipcMain.handle(types.CH.rename, (_e, p, newName) => renameOne(p, newName));
  ipcMain.handle(types.CH.renameMany, (_e, pairs) => renameMany(pairs));
  ipcMain.handle(types.CH.remove, (_e, paths, toTrash) => remove(paths, toTrash));
  ipcMain.handle(types.CH.mkdir, (_e, parent, name) => mkdir(parent, name));
  ipcMain.handle(types.CH.newFile, (_e, parent, name) => newFile(parent, name));
  ipcMain.handle(types.CH.undo, () => undo());
  ipcMain.handle(types.CH.undoLabel, () => undoLabel());
  ipcMain.handle(types.CH.clipCopy, (_e, paths) => {
    fileClipboard = { paths, cut: false };
    electron.clipboard.writeText(paths.join("\r\n"));
    return { ok: true };
  });
  ipcMain.handle(types.CH.clipCut, (_e, paths) => {
    fileClipboard = { paths, cut: true };
    electron.clipboard.writeText(paths.join("\r\n"));
    return { ok: true };
  });
  ipcMain.handle(types.CH.clipRead, () => fileClipboard);
  ipcMain.on(types.CH.copyText, (_e, text) => electron.clipboard.writeText(text));
  ipcMain.handle(types.CH.preview, (_e, p) => preview(p));
  ipcMain.handle(types.CH.fileIcons, (_e, items, size) => fileIcons(items, size));
  ipcMain.handle(types.CH.folderSize, (_e, p) => folderSize(p));
  ipcMain.handle(types.CH.gitStatus, (_e, dir) => gitStatus(dir));
  ipcMain.on(types.CH.search, (_e, q) => void startSearch(q));
  ipcMain.on(types.CH.cancelSearch, (_e, id) => cancelSearch(id));
  ipcMain.on(types.CH.startDrag, (e, paths) => {
    if (!paths.length) return;
    void electron.app.getFileIcon(normalize(paths[0]), { size: "normal" }).then((icon) => {
      const files = paths.map(normalize);
      e.sender.startDrag({ file: files[0], files, icon });
    }).catch(() => void 0);
  });
  ipcMain.handle(types.CH.loadSettings, () => host.loadSettings());
  ipcMain.handle(types.CH.saveSettings, (_e, s) => host.saveSettings(s));
  ipcMain.handle(types.CH.pickFolder, async () => {
    const win = getWindow();
    if (!win) return null;
    const res = await electron.dialog.showOpenDialog(win, { properties: ["openDirectory"] });
    return res.canceled || !res.filePaths[0] ? null : normalize(res.filePaths[0]);
  });
  ipcMain.handle(types.CH.appVersion, () => electron.app.getVersion());
}
const ONYX_MEDIA_SCHEME = {
  scheme: "onyx-media",
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
};
function registerOnyxMediaScheme() {
  electron.protocol.registerSchemesAsPrivileged([ONYX_MEDIA_SCHEME]);
}
function handleOnyxMedia() {
  electron.protocol.handle(ONYX_MEDIA_SCHEME.scheme, (request) => {
    const target = new URL(request.url).searchParams.get("p");
    if (!target) return new Response("Bad request", { status: 400 });
    const resolved = normalize(target);
    if (!isAbsolute(resolved)) return new Response("Forbidden", { status: 403 });
    return electron.net.fetch(node_url.pathToFileURL(resolved).toString(), { bypassCustomProtocolHandlers: true });
  });
}
const ONYX_MEDIA_CSP = {
  "img-src": "data: blob: onyx-media:",
  "media-src": "blob: onyx-media:",
  "frame-src": "onyx-media:",
  "connect-src": "onyx-media:"
};
exports.DEFAULT_SETTINGS = types.DEFAULT_SETTINGS;
exports.ONYX_MEDIA_CSP = ONYX_MEDIA_CSP;
exports.ONYX_MEDIA_SCHEME = ONYX_MEDIA_SCHEME;
exports.handleOnyxMedia = handleOnyxMedia;
exports.registerFsIpc = registerFsIpc;
exports.registerOnyxMediaScheme = registerOnyxMediaScheme;
