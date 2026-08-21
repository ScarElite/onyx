# Vendored from Conduit

These two files are Conduit's committed `lib/` build of its embeddable
`<Terminal/>` — xterm and its addons inlined, React externalized. Do not edit
them here; change them in Conduit, run `npm run build:lib` there, then re-run:

    node scripts/sync-conduit-terminal.mjs

- source: local checkout: C:\Users\mra02\OneDrive\Documents\GitHub\Conduit
- commit: `b74bd385a06a97b0042065019f2e4bd88947de45`
- files: conduit-terminal.js, conduit-terminal.css

The hand-written `conduit-terminal.d.ts` next to them mirrors Conduit's
`TerminalProps` / `PtyApi`. If Conduit's contract changes, update it too.
