---
name: verify
description: Drive a dev Onyx instance end-to-end (keyboard, mouse, file operations, screenshots) via CDP to verify renderer/main changes against the real app.
---

# Verifying Onyx changes against the running app

Onyx is a file explorer, so "does it work?" means "did it do the right thing to the
real filesystem?" — which typecheck and unit tests cannot answer. Drive the running
app instead.

## Launch a dev instance with CDP

```powershell
npm start -- -- --remote-debugging-port=9222   # double "--": npm -> forge -> electron
```

Run it in the background, then poll `http://127.0.0.1:9222/json` until a `page`
target titled "Onyx" appears (~15–30s on a cold Electron download, ~5s after).

## Drive it

`cdp-eval.mjs` and `cdp-drive.mjs` live next to this file (plain Node ≥22, no deps):

```powershell
node .claude/skills/verify/cdp-eval.mjs "document.querySelectorAll('.row').length"
```

For anything with backslashes in it, **write a probe script to a file** rather than
passing an expression on the command line — shell quoting mangles Windows paths, and
the failure looks like a bug in the app rather than a bug in the harness. Inside the
page, build paths with `String.fromCharCode(92)` so no quoting layer can touch them.

Two things worth exercising directly through `window.onyx` rather than the UI, since
they're the parts most likely to be subtly wrong:

- **`ops.ts` + the undo journal** — mkdir/rename/copy/move/`renameMany`, then `undo()`,
  asserting the directory listing afterwards. Always against a scratch directory.
- **the `onyx-media:` protocol** — `preview(p)` then load `pv.src` into an `Image()`
  and check `naturalWidth`. A blank preview pane looks identical whether the protocol
  is broken, the CSP blocks it, or the file is genuinely unreadable.

## Screenshots: use CDP, not PrintWindow

```powershell
node <scratch>/shot.mjs out.png   # Page.captureScreenshot
```

Chromium throttles compositing for backgrounded windows, so `PrintWindow` (and
`CopyFromScreen`) will happily return a **stale frame** — one that shows the UI as it
was several actions ago. `Page.captureScreenshot` forces a fresh render. If a
screenshot ever disagrees with what a `Runtime.evaluate` reports, trust the evaluate.

`SendKeys` is also unreliable here: Windows blocks foreground-stealing, so the keys
often land in another window. Dispatch events into the page instead — and note that
React controlled inputs need the native setter:

```js
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
setter.call(input, 'ext:png');
input.dispatchEvent(new Event('input', { bubbles: true }));
```

## Cleanup

`Get-Process electron | Stop-Process -Force` ends the dev instance. Onyx has no
single-instance lock and no installed build to protect, so unlike Conduit there is no
separate user-data dance — but note that a force-kill skips the `beforeunload` settings
flush, so the last few hundred ms of settings/session changes are lost.
