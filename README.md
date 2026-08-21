# Onyx

A custom, fully themeable file explorer for Windows. Does everything File Explorer does —
browse, open, copy, move, rename, delete, drag & drop — but every color is yours to change
live, the layout splits and tabs like a code editor, and it knows the things Explorer
refuses to learn: git, real folder sizes, undo, and a query filter bar.

Onyx is **Conduit's sibling**: same stack, same process split, same
[vlime palette family](#theming) as V's Command Center.

## Why

File Explorer is fine, but it isn't *mine*. Onyx is: live theme switching, tabs and split
panes, a command palette, a filter language, folder sizes that actually appear, git status
inline, and a Ctrl+Z that works — owning 100% of the chrome and behavior around the
filesystem.

## Stack

- **Electron** (+ Electron Forge, Vite, TypeScript) — app shell
- **React 19** — all UI (pinned to match V's Hub)
- **electron-store** — persisted settings and session
- Node's own `fs` + the `git` CLI — the explorer itself needs no native modules
- **node-pty** — the docked terminal's real pseudoterminal (ConPTY). The one native
  dependency, and the only reason a C++ toolchain is needed. See *Building the terminal*.

## Features

- [x] **Tabs + split panes** — Ctrl+T, Ctrl+\ splits, drag the divider, Ctrl+1..9 to focus
- [x] **Live theming** — the 13-palette vlime family, applied as CSS variables with no reflow
- [x] **Sidebar** — pinned places, Quick Access, and drives with live capacity bars
- [x] **Query filter bar** — `ext:png size:>10mb mod:today -draft`, ANDed and instant
- [x] **Command palette** — Ctrl+P fuzzy-jumps to a folder, Ctrl+Shift+P runs any command
- [x] **Preview pane + Space-to-peek** — images, text/code, PDF, video, audio, metadata
- [x] **Recursive search** — names and file contents, streaming and cancellable
- [x] **Git-aware** — per-row status dots, branch + dirty count in the breadcrumb
- [x] **Real folder sizes** — computed in the background with an inline heat bar
- [x] **File ops with undo** — copy/cut/paste, drag & drop, delete to the Recycle Bin
- [x] **Batch rename** — find/replace, regex, case ops, numbering, with a live preview
- [x] **Session restore** — tabs, splits, folders and history come back on launch
- [x] **Docked terminal with two-way cwd sync** — Conduit's `<Terminal/>` on an Onyx pty
- [ ] "Ask V" on a selection, and the Hub panel build (Phase 7)

See **ONYX_HANDOFF.md** for the full architecture, phased plan, and the Windows gotchas.

## Keyboard

| Key | Action |
|-----|--------|
| Enter / Double-click | Open |
| Backspace / Alt+Left / Alt+Right | Up / Back / Forward |
| Ctrl+T / Ctrl+W / Ctrl+Tab | New tab / close / next |
| Ctrl+\ / Ctrl+Shift+\ / Ctrl+1..9 | Split right / split down / focus pane |
| Ctrl+P / Ctrl+Shift+P | Go to folder / run a command |
| Ctrl+F / Ctrl+Shift+F | Filter bar / recursive search |
| Space | Peek at the selected file |
| F2 / Shift+F2 | Rename / batch rename |
| F5 / F6 | Copy / move selection to the other pane |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / cut / paste |
| Delete / Shift+Delete | Recycle Bin / permanent |
| Ctrl+Z | Undo the last file operation |
| Ctrl+N / Ctrl+H / Ctrl+, | New folder / toggle hidden / Settings |
| Ctrl+` | Toggle the docked terminal |
| Ctrl+ +/− / Ctrl+0 | Text size / reset |

**Drag & drop:** dragging inside Onyx moves (hold Ctrl to copy), and files dropped in from
Explorer are copied. Hold **Alt** as you start a drag to hand the files to *another
application* — that path uses Electron's OS-level drag, which takes over the pointer and so
cannot also be the default.

## The docked terminal

Ctrl+` opens a real PowerShell under the pane, and the two stay in step **both ways**:

- **pane → shell** — navigating writes a `Set-Location`, but only when the shell is
  actually sitting at an idle prompt. Otherwise it's queued and flushed at the next
  prompt, so it never lands in the middle of a line you're typing or in a running
  program's stdin.
- **shell → pane** — Onyx injects a prompt wrapper that emits **OSC 7** on every prompt;
  main parses it, so a plain `cd` moves the file pane. The wrapper *wraps* rather than
  replaces `prompt`, so oh-my-posh / Starship keep working.

The terminal itself is Conduit's `<Terminal/>`, vendored into `src/renderer/vendor/`
rather than installed as a git dependency. Its bundle already inlines xterm and
externalizes only React, so it needs nothing at runtime — but installing Conduit as a
dependency would also install *its* dependencies, including a second, unbuilt copy of
node-pty sitting next to ours. Two committed files are the cheaper, clearer trade.
Re-sync it with:

```bash
node scripts/sync-conduit-terminal.mjs   # prefers a sibling Conduit checkout
```

`src/renderer/vendor/SOURCE.md` records the exact commit it came from.

### Building the terminal

node-pty is native, so it needs a C++ toolchain
(`winget install Microsoft.VisualStudio.2022.BuildTools`, "Desktop development with C++",
plus Python 3) and a rebuild against Electron's ABI:

```bash
npm install      # postinstall applies patches/ automatically
npm run rebuild  # electron-rebuild -f -w node-pty
```

> **node-pty + Spectre:** node-pty's Windows build requests Spectre-mitigated MSVC
> libraries. Rather than require that VS component, Onyx disables the flag via
> `patch-package` (`patches/node-pty+1.1.0.patch`, borrowed from Conduit and re-applied
> by the `postinstall` hook). For the hardened build instead, install "MSVC v143
> Spectre-mitigated libs" in the VS Installer and delete the patch.

> **If `npm run rebuild` fails with `'GetCommitHash.bat' is not recognized`:** something
> in the environment has set `NoDefaultCurrentDirectoryInExePath`, which drops the
> current directory from the exe search path and breaks node-gyp's winpty step. Clear it
> first: `Remove-Item Env:NoDefaultCurrentDirectoryInExePath`.

## Theming

Every palette is three knobs plus a glow multiplier, exactly as in V's Command Center:

```ts
makeVlime('Lime', { h: 104, s: 86, l: 60, glow: 1 })
```

The structure never moves — near-black green-tinted background, warm light foreground — and
only the accent shifts: borders, focus rings, selection, scrollbar, active tab, drive bars,
HUD brackets. Adding a palette is one line in `src/renderer/themes.ts`. Themes are applied
as CSS custom properties on `:root`, so switching is a few variable writes and one repaint.

## Embedding in V's Hub

The explorer is split at a hard `FsApi` boundary so it can drop into the Command Hub as a
panel without a rewrite — the same trick Conduit uses for its `<Terminal/>`.
`src/renderer/Explorer.tsx` is host-agnostic: it imports no `electron`, no `window.onyx`,
no `fs`, and is driven entirely by an injected object.

```ts
interface FsApi {
  readDir(path: string): Promise<DirListing>;
  watch(path: string, cb: (ev: FsEvent) => void): () => void;
  copy(srcs: string[], destDir: string, policy: ConflictPolicy): Promise<OpResult>;
  // …see src/renderer/fs-api.ts for the full contract
}

// <Explorer fsApi={api} settings={settings} onSettingsChange={…} initialPath="C:\\" />
```

The standalone app implements it over the preload bridge (`createBridgeFsApi()`); the Hub
implements it over its own main process. Same contract → no rewrite.

## Getting started

```bash
npm install          # no native modules, no C++ toolchain needed
npm start            # dev (Vite + Electron)

npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run package      # a runnable app under out/Onyx-win32-x64/
npm run make         # OnyxSetup.exe + RELEASES + .nupkg under out/make/
npm run publish      # upload those to a GitHub Release tagged v<version>
```

**Prereqs:** Windows 10 1809+, Node 18+.

### Updates

Installed copies check GitHub Releases on launch and every 10 minutes via
`update.electronjs.org`, download in the background, and apply on the next launch —
`notifyUser: false`, because a file manager should never throw a modal over a drag
you're halfway through. When a version is staged the title bar offers *Update ready —
restart*. This only works in a **Squirrel-installed** build: run straight from
`out/Onyx-win32-x64/` and the updater correctly reports "Can not find Squirrel".

To ship one: bump `version` in `package.json`, then `npm run publish`. The repo must
be public and the release non-draft, or `update.electronjs.org` won't serve it.

### Icon

`assets/icons/onyx.ico` is generated and **committed**, so packaging never depends on
Python. Regenerate only when the mark changes:

```bash
python scripts/build-icon.py    # needs Pillow
```

## Known limitations

- **Hidden/system attributes are inferred**, not read. Node does not surface Windows file
  attributes, so Onyx uses the dot-prefix convention plus a list of known system items
  (`$Recycle.Bin`, `pagefile.sys`, …). A file marked hidden by any other means still shows.
- **Cloud placeholders are detected by path**, not by reparse tag: anything under a OneDrive
  root is treated as possibly-not-on-disk, which keeps content search and sizing from
  triggering downloads. `stat` never hydrates a placeholder, so sizes and dates stay right.
- **The file clipboard is Onyx's own.** Windows file copy/paste interop needs CF_HDROP plus
  a "Preferred DropEffect" blob that Electron's clipboard API doesn't model, so Ctrl+C in
  Explorer and Ctrl+V in Onyx do not yet exchange files. Paths are mirrored to the clipboard
  as text, and drag & drop between the two works in both directions.
- **Recycle Bin deletes cannot be undone in-app.** Windows exposes no API to restore a
  specific item, so Onyx says so plainly instead of pretending. Copy, move, rename, batch
  rename and new-folder are all fully undoable.

## License

Private / personal project.
