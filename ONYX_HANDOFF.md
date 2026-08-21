# Onyx — Build Handoff

> **What this is:** A custom, fully themeable file explorer for Windows. Does everything
> File Explorer does — browse, open, copy, move, rename, delete, drag & drop — but every
> color is yours to change live, the layout splits and tabs like a code editor, and it
> knows about the things Explorer refuses to learn: git, real folder sizes, undo, and a
> terminal that follows you around.
>
> **Family:** Onyx is Conduit's sibling. Same stack (Electron Forge + Vite + TS + React 19),
> same process split, same `electron-store` persistence, same **vlime** theme family derived
> from three accent knobs. Built to dock as a panel inside V's Command Hub alongside Conduit.

This document is the spec. Build it in phases, in order.

---

## 1. What it must do (acceptance criteria)

v1 is "done" when all of these are true:

1. **Browses for real.** Opens any drive/folder on the machine, lists entries with name /
   size / modified / type, sorts by any column, navigates in (double-click / Enter) and out
   (Backspace / Alt+Left), and survives permission-denied folders without crashing.
2. **Tabs + splits.** A tab strip per window; each tab holds a pane tree that splits
   horizontally or vertically (up to 4 panes). Each pane has its own cwd, selection, scroll,
   and history.
3. **Sidebar.** Pinned places (user-editable), Quick Access, and live drive rows with
   used/free capacity bars.
4. **Live theming.** A settings panel changes every chrome color; the 13-palette vlime
   family from V's Command Center ships as presets; user themes persist across restarts.
   Changes apply live, no restart.
5. **File operations, safely.** Copy / cut / paste / rename / delete (to Recycle Bin by
   default) / new folder, with progress for long operations and **a working undo**.
6. **Preview pane.** Selecting a file shows it: images, text/code, PDF, video/audio,
   plus metadata. Spacebar opens the same preview as a full-window peek.
7. **Command palette.** Fuzzy-jump to any folder; a second palette runs any action.
8. **Search.** Recursive name search (and optional content grep) in the current tree,
   streaming results as they're found, cancellable.
9. **Git-aware.** Inside a repo: branch in the breadcrumb, per-row status badges, ignored
   files dimmed.
10. **Persistence.** Tabs, splits, cwds, sidebar pins, theme, and settings reload on launch.

---

## 2. What makes Onyx *not* just another Explorer

These are the reasons the app exists. Ordered by leverage.

| # | Feature | Why Explorer can't |
|---|---------|-------------------|
| 1 | **Two-way terminal sync.** A docked Conduit terminal at the bottom of each pane, always cd'd to the pane's folder. Navigate in the UI, the shell follows. `cd` in the shell, the pane follows (via OSC 7). | Explorer's "Open in Terminal" is one-way and one-shot. |
| 2 | **Ask V.** Select files, send their paths + metadata to V's brain over `ws://127.0.0.1:8765/ws`. "What is this folder?", "rename these sensibly", "which of these are duplicates?" | — |
| 3 | **Undo that works.** A journal of every mutating op; undo reverses rename / move / delete / new-folder. Deletes go to the Recycle Bin so they're restorable even after a crash. | Explorer's undo is famously unreliable and forgets across sessions. |
| 4 | **Query filter bar.** Type `ext:png size:>10mb mod:today` to live-filter the pane. Composable, instant, no dialog. | — |
| 5 | **Real folder sizes.** Background recursive sizing per row with an inline heat bar, cached and invalidated by the watcher. | Explorer shows blank for folders forever. |
| 6 | **Space-to-peek.** macOS Quick Look: select, press Space, see the file. Space again to dismiss. | — |
| 7 | **Session restore.** Close the window mid-task; reopen to the same tabs, splits, folders, and scroll positions. | — |
| 8 | **Commander transfers.** When a tab is split, F5 copies and F6 moves the selection to *the other pane* — Total Commander muscle memory, without giving up the modern layout. | — |
| 9 | **Git status inline.** Modified/untracked/staged badges per row, ignored files dimmed, branch + dirty count in the breadcrumb. | — |
| 10 | **Batch rename with live preview.** Find/replace, regex, numbering, case ops — with a before/after table you confirm before anything touches disk. | — |

---

## 3. Stack

Identical to Conduit unless noted, so the two apps stay maintainable as a pair.

**Shell**
- `electron` — app shell
- **Electron Forge** with the **Vite + TypeScript** template (`@electron-forge/plugin-vite`)
- `react` 19 + `react-dom` 19 — all UI (pinned to match V's Hub)
- `electron-store` — typed JSON settings in the user-data dir

**Explorer-specific**
- Node's own `fs.promises` — listing, sizing, search. No native modules.
- Node's own `fs.watch`, non-recursive, one watcher per visible folder. **No chokidar.**
  The usual argument for chokidar is that `fs.watch` can't correlate the delete+create pair
  a rename produces on Windows — but Onyx never needs that correlation, because any event
  means "re-list this folder". Dropping it also avoids a real packaging trap: the Forge Vite
  plugin excludes `node_modules` from the packaged app, so any externalized dependency has
  to be copied back in by hand (Conduit does exactly that dance for node-pty). Zero runtime
  deps outside the bundle means zero of that.
- `git` via `child_process` — **the CLI, not a library.** `git status --porcelain=v2 -z`
  is fast, always correct, and adds zero dependencies.

**Deliberately NOT used**
- No `node-pty` until Phase 6 (terminal dock). It needs a C++ toolchain and is the single
  slowest part of Conduit's setup — keep Phases 0-5 installable with a bare `npm install`.
- No shell-extension / COM integration. Windows context-menu verbs are invoked through
  `shell.openPath` / `shell.showItemInFolder` instead.
- No virtual-list library. The list is a fixed row height and an absolute-positioned window
  over a spacer — ~40 lines, and it means the row markup stays ours.

---

## 4. Architecture

Three processes, strictly separated. The renderer never touches `fs` — it can't; it has no
Node. Every filesystem call crosses a narrow, typed IPC surface.

```
+------------------------ MAIN PROCESS (Node.js) -------------------------+
|  fs-service.ts  readDir / stat / drives / fs.watch watchers             |
|  ops.ts         copy / move / rename / delete(->Recycle Bin) + undo log |
|  search.ts      streaming recursive name+content search                 |
|  sizes.ts       background recursive folder sizing (cached)             |
|  git.ts         `git status --porcelain=v2` per repo, debounced         |
|  preview.ts     text head / image data-URL / media metadata             |
|  settings.ts    electron-store wrapper + defaults                       |
|  Exposes a NARROW, typed API over IPC. Validates every path.            |
+--------------------------------+----------------------------------------+
                                 |  contextBridge (preload.ts) -> window.onyx
+--------------------------------v----------------------------------------+
|  RENDERER (Chromium) — the UI                                            |
|  React 19: titlebar, sidebar, tab strip, pane tree, file list, preview,  |
|  command palette, settings. NO Node access.                              |
|  Talks to main ONLY through the preload bridge.                          |
+--------------------------------------------------------------------------+
```

**Hard rules for the BrowserWindow** (same as Conduit):

```ts
webPreferences: {
  contextIsolation: true,   // required
  nodeIntegration: false,   // required
  sandbox: false,           // preload needs a couple of Node primitives
  preload: /* path to preload.js */,
}
```

**Security note that matters more here than in Conduit:** every path arriving from the
renderer is attacker-controlled *in principle* (a malicious page can't reach it, but a bug
in our own UI can). `ops.ts` resolves and normalizes every path before acting, refuses
paths that aren't absolute, and refuses recursive delete of a drive root. See §9.

### The FsApi boundary (why Onyx can live in the Hub)

Conduit split at `PtyApi` so `<Terminal/>` could drop into V's Hub without a rewrite. Onyx
does the same thing at `FsApi`. `src/renderer/Explorer.tsx` is **host-agnostic**: it imports
no `electron`, no `fs`, and receives everything it needs as an injected object.

```ts
interface FsApi {
  readDir(path: string): Promise<DirListing>;
  watch(path: string, cb: (ev: FsEvent) => void): () => void;   // returns unsubscribe
  drives(): Promise<DriveInfo[]>;
  homeDir(): Promise<string>;

  open(path: string): Promise<void>;              // launch with default app
  revealInExplorer(path: string): Promise<void>;
  copy(srcs: string[], destDir: string): Promise<OpResult>;
  move(srcs: string[], destDir: string): Promise<OpResult>;
  rename(path: string, newName: string): Promise<OpResult>;
  remove(paths: string[], toTrash: boolean): Promise<OpResult>;
  mkdir(parent: string, name: string): Promise<OpResult>;
  undo(): Promise<OpResult>;

  preview(path: string): Promise<PreviewPayload>;
  search(q: SearchQuery, onHit: (h: SearchHit) => void): () => void;  // returns cancel
  folderSize(path: string): Promise<number>;
  gitStatus(dir: string): Promise<GitStatus | null>;
}

// <Explorer fsApi={api} theme={theme} initialPath="C:\\" />
```

The standalone app implements `FsApi` over `window.onyx` (`src/renderer/fs-api.ts`); the
Hub implements it over its own main process. **Same contract, no rewrite.**

In practice a host needs all three layers, so Onyx ships all three as committed bundles
(`npm run build:embed`), consumable as a git dependency with no toolchain — no Electron
download, no `prepare` step:

| Import | File | What it is |
|--------|------|-----------|
| `onyx` | `lib/onyx-explorer.js` | `<Explorer/>`, `createBridgeFsApi()`, the vlime `PRESETS`, `DEFAULT_SETTINGS`. ESM, React externalized. |
| `onyx/style.css` | `lib/onyx-explorer.css` | The chrome, **scoped to `.onyx-root`** at build time (see below). |
| `onyx/main` | `lib/onyx-main.cjs` | `registerFsIpc(host)` — every handler behind `FsApi` — plus the `onyx-media:` scheme. CJS, `electron` external. |
| `onyx/preload` | `lib/onyx-preload.cjs` | `exposeOnyxBridge()` — puts `window.onyx` in place. CJS. |

Two things make this work rather than merely compile:

- **The main process is shared, not reimplemented.** `registerFsIpc()` (`src/main/register-fs-ipc.ts`)
  is called by Onyx's own `main.ts` *and* by the Hub's, with only a `send`, a window getter,
  and a settings pair injected. A host that reimplemented this would be reimplementing §9 —
  OneDrive placeholders, junction loops, MAX_PATH, per-entry permission failures — and would
  get them wrong silently, months later.
- **The stylesheet cannot escape the panel.** `styles.css` is written for an app that owns its
  document: it resets `html, body, #root`, restyles bare `button`/`input`, and paints every
  scrollbar. The library build rewrites every selector through PostCSS — document-level ones
  collapse onto `.onyx-root` (the mount container *is* the explorer's document), everything
  else becomes a descendant of it. Drop the CSS in any host and nothing outside the panel
  changes. Pair it with `applyTheme(theme, offset, containerEl)`, which already takes the
  container as its root.

---

## 5. Project structure

```
onyx/
├─ src/
│  ├─ main/
│  │  ├─ main.ts          # lifecycle, BrowserWindow, CSP, onyx-media:, IPC
│  │  ├─ fs-service.ts    # readDir / stat / drives / fs.watch watchers
│  │  ├─ ops.ts           # copy/move/rename/delete + the undo journal
│  │  ├─ search.ts        # streaming recursive search
│  │  ├─ sizes.ts         # background folder sizing + cache
│  │  ├─ git.ts           # `git status --porcelain=v2` reader
│  │  ├─ preview.ts       # preview payload builder
│  │  └─ settings.ts      # electron-store wrapper + defaults
│  ├─ preload/
│  │  └─ preload.ts       # contextBridge.exposeInMainWorld('onyx', {...})
│  ├─ renderer/
│  │  ├─ renderer.tsx     # React root (standalone app only)
│  │  ├─ App.tsx          # window chrome: titlebar + sidebar + tabs + <Explorer/>
│  │  ├─ Explorer.tsx     # HOST-AGNOSTIC root — the embeddable component
│  │  ├─ fs-api.ts        # FsApi implementation over window.onyx
│  │  ├─ themes.ts        # the vlime family (see §6)
│  │  ├─ styles.css       # HUD chrome
│  │  └─ components/      # TabStrip, PaneTree, FileList, Breadcrumb, Sidebar,
│  │                      # PreviewPane, CommandPalette, SettingsPanel, RenameDialog
│  └─ shared/
│     └─ types.ts         # FsEntry, Settings, Theme, channel names — dependency-free
├─ assets/icons/onyx.ico
├─ forge.config.ts
├─ vite.{main,preload,renderer,lib}.config.ts
└─ ONYX_HANDOFF.md
```

---

## 6. Theming — the vlime family, verbatim

Onyx inherits V's Command Center palette system unchanged, so all three apps look like one
product. The rule: **structure is constant, one accent moves.**

A palette is three knobs plus a glow multiplier:

```ts
makeVlime('Lime', { h: 104, s: 86, l: 60, glow: 1 })
```

- Background: `hsl(150 9% 3.5%)` — near-black with a whisper of green. Shared by every
  palette. Noir alone darkens it.
- Foreground: `hsl(90 6% 90%)` — warm light gray. Shared.
- Everything accent-colored — cursor, borders, focus rings, selection, scrollbar, glow,
  active tab, drive bars, HUD brackets — derives from `h/s/l`.
- Saturation is **clamped** on derived chrome (`Math.min(s, 45)` for borders, 42 selection,
  32 scrollbar) so the low-saturation palettes (Mono) stay grey instead of tinting green.

The 13 presets, in Hub order: Lime (default), Bright, Emerald, Cyan, Ice, Violet, Synthwave,
Magenta, Crimson, Amber, Gold, Mono, Noir.

**Applied at runtime as CSS custom properties on `:root`** (`applyChrome()` in `themes.ts`),
exactly like Conduit — so a theme switch is a handful of variable writes and repaints
instantly, with no React re-render of the tree.

HUD signatures carried over from Conduit's `styles.css`:
- `.app::before/::after` — corner brackets framing the window like a targeting readout
- inset accent glow hugging the window border
- faint top radial accent-glow + 1px/3px scanlines on the titlebar
- 10px clipped corners on panels
- JetBrains Mono for all HUD chrome and every numeric readout (`font-feature-settings: "tnum"`)

**Onyx additions to the theme type** (beyond Conduit's `Theme`): row striping alpha, the
git badge colors (added/modified/untracked/ignored), and the folder-size heat-bar ramp.

---

## 7. Phases

Build in order. Each phase ends runnable.

### Phase 0 — Scaffold + a real listing — DONE
Forge/Vite/TS scaffold, frameless window with the Conduit titlebar, `fs-service.readDir`
over IPC, and a plain file list you can double-click into and Backspace out of. Drives in
the sidebar. **This proves the IPC shape before any feature is built on it.**

### Phase 1 (DONE) — Chrome + theming
Port `themes.ts` and `styles.css` from Conduit. Settings panel with the palette grid, live
apply, custom themes, persistence. Window controls, opacity, font zoom.

### Phase 2 (DONE) — Tabs, splits, navigation
Tab strip, pane tree (split H/V, focus, close), per-pane history (back/forward/up),
breadcrumb with click-to-jump and click-to-edit, session restore.

### Phase 3 (DONE) — File operations + undo
Copy/cut/paste, drag & drop (internal *and* from/to Explorer), rename, delete to Recycle
Bin, new folder, conflict resolution dialog, progress UI, and the undo journal.
**Write the undo journal before the ops, not after** — an op that isn't journaled is a bug.

### Phase 4 (DONE) — Preview, palette, filter
Preview pane + Space peek, fuzzy path jump, action palette, query filter bar
(`ext:` `size:` `mod:` `name:`).

### Phase 5 (DONE) — Search, git, sizes
Streaming recursive search; `git status` badges + branch in breadcrumb; background folder
sizing with heat bars. All three are "slow work off the UI thread" — share one pattern.

### Phase 6 — Terminal dock (adds node-pty) — DONE
Add `node-pty` and consume `<Terminal/>` from the Conduit git dependency. Wire two-way cwd
sync via OSC 7. **This is the phase that needs the C++ toolchain** — see Conduit's README
for the Spectre-libs patch story; reuse `patches/node-pty+1.1.0.patch` verbatim.

### Phase 7 — Ask V + Hub panel — DONE
WebSocket client to V's brain; "Ask V" on a selection. `build:embed` the three bundles (§4)
and dock `<Explorer/>` in the Hub — the Hub side lands in `ai-assistant` as the Explorer
panel on the left rail, injecting an `assistant` adapter over the brain connection it
already holds rather than opening a second socket.

---

## 8. Keyboard map

Explorer-compatible where Explorer has a convention, VS Code-compatible where it doesn't.

| Key | Action |
|-----|--------|
| Enter / Double-click | Open (folder navigates, file opens in default app) |
| Backspace / Alt+Left | Up / Back — Alt+Right forward |
| Ctrl+T / Ctrl+W | New tab / close tab — Ctrl+Tab next tab |
| Ctrl+Backslash | Split pane — Ctrl+1..9 focus pane — Ctrl+Shift+Backslash unsplit |
| Ctrl+P / Ctrl+Shift+P | Fuzzy path jump / action palette |
| Ctrl+F | Filter bar — Ctrl+Shift+F recursive search |
| Space | Peek (Quick Look) |
| F2 | Rename — Shift+F2 batch rename |
| F5 / F6 | Copy / move selection to the other pane (when split) |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / cut / paste |
| Delete / Shift+Delete | Recycle Bin / permanent (with confirm) |
| Ctrl+Z | Undo last file operation |
| Ctrl+N | New folder — Ctrl+, Settings — Ctrl+Backtick toggle terminal dock |
| Ctrl+H | Toggle hidden files |

---

## 9. Gotchas (the parts that will waste your time)

1. **Windows paths are not POSIX paths.** Normalize with `path.win32`. Handle: UNC paths
   (`\\server\share`), drive-relative paths, trailing-backslash roots (`C:\` vs `C:`),
   reserved names (`CON`, `PRN`, `NUL`, `COM1`), and the 260-char `MAX_PATH` limit — use
   the `\\?\` prefix for long paths in ops.
2. **`fs.watch` lies on Windows.** Renames arrive as delete+create with no correlation, and
   recursive watching from a drive root will melt the machine. Watch only visible cwds,
   non-recursively, and treat every event as "re-list this folder" rather than trying to
   apply a delta — that makes the missing correlation irrelevant. Debounce at ~120ms; a
   single copy fires dozens of events per file.
3. **Permission-denied is normal, not exceptional.** `C:\System Volume Information`,
   `C:\$Recycle.Bin`, and other people's user folders throw `EPERM`/`EACCES` on read. Catch
   per-entry, render the row as inaccessible, and never let one bad entry kill the listing.
4. **`stat` on every entry is slow.** `readdir(dir, { withFileTypes: true })` gives you
   name + type in one syscall. Only `stat` what's visible (virtualized rows), and batch it.
5. **Symlinks and junctions.** Use `lstat`, not `stat`, or you'll follow a junction loop
   (`C:\Users\All Users` to `C:\ProgramData` is a classic). Mark them and never recurse
   through them when sizing or searching.
6. **OneDrive placeholders.** Files with `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS` are stubs;
   reading one triggers a download. Never read placeholder content for previews, sizes, or
   search — detect and skip. (This machine's whole `Documents` tree is OneDrive — you will
   hit this immediately.)
7. **Recycle Bin, not `unlink`.** `shell.trashItem()`. A file explorer whose Delete key is
   unrecoverable is a liability, and it's the one bug users never forgive.
8. **Delete guards.** Refuse to recursive-delete a drive root, the user profile root, or
   anything resolving outside an explicitly confirmed selection. Cheap insurance.
9. **Drag & drop crosses the process boundary.** Files dragged *in* from Explorer arrive as
   `File` objects — get their real path via `webUtils.getPathForFile` (Conduit already does
   this in `preload.ts`; copy that code). Dragging *out* needs `webContents.startDrag` in
   main, which requires an icon or the drag silently fails.
10. **`git status` on a big repo is not free.** Debounce, cache per repo root, run with
    `--porcelain=v2 -z --untracked-files=normal`, and never block a listing on it — badges
    arrive asynchronously and paint in.
11. **CSP, and `file:` URLs do not work.** Same dev/prod split as Conduit, set via response
    headers in main. But note previews cannot use `file:` at all: in dev the renderer's
    origin is the Vite dev server, and Chromium blocks a cross-origin `file:` fetch no
    matter what the CSP says. Serve media through a registered custom scheme
    (`onyx-media:`) instead — it also streams range requests, so video scrubbing works, and
    inlining as base64 would cost a full read plus 33% for every preview.
12. **Don't hold a directory handle open.** Windows will refuse to let the user rename or
    delete the folder you're viewing. Read and release; never keep a stream open on a cwd.

---

## 10. Testing checklist

Verify each by hand on this machine — these are the paths that break real explorers:

- [ ] `C:\` root — permission errors handled, drive bars correct
- [ ] `C:\Users\mra02\OneDrive\Documents\GitHub` — 18+ folders, OneDrive placeholders
- [ ] A git repo (`Conduit`) — badges, branch, ignored dimming, `node_modules` sizing
- [ ] `D:\ai-assistant` — second drive, `.venv` with tens of thousands of files
- [ ] A folder with 10,000+ entries — virtualization holds 60fps
- [ ] Rename, then undo — the name comes back
- [ ] Delete to Recycle Bin, then restore from the Bin
- [ ] Drag a file in from Explorer, and out to Explorer
- [ ] Unplug/replug a USB drive while the sidebar is visible
- [ ] Theme switch mid-scroll — no flash, no relayout
