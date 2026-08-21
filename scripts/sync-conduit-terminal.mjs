// Vendor Conduit's prebuilt <Terminal/> bundle into src/renderer/vendor/.
//
// Why vendor rather than `npm i github:ScarElite/Conduit`:
// Conduit's lib/ bundle already inlines xterm and its addons and externalizes only
// React — it needs NOTHING at runtime. But installing Conduit as a git dependency
// also installs its `dependencies`, which include a SECOND copy of node-pty. That
// copy would be unbuilt for Electron's ABI and sitting in the tree next to ours,
// which is exactly the kind of ambiguity that makes a native module fail at
// runtime in a packaged build. Two committed files are the cheaper, clearer trade.
//
//   node scripts/sync-conduit-terminal.mjs [path-to-conduit-checkout]
//
// Prefers a local checkout (fast, offline); falls back to raw.githubusercontent.
// Records the exact source commit in vendor/SOURCE.md so the copy is traceable.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VENDOR = path.join(ROOT, 'src', 'renderer', 'vendor');
const FILES = ['conduit-terminal.js', 'conduit-terminal.css'];
const REPO = 'ScarElite/Conduit';

const localCheckout =
  process.argv[2] ?? path.join(path.dirname(ROOT), 'Conduit');

mkdirSync(VENDOR, { recursive: true });

let commit = 'unknown';
let source;

if (existsSync(path.join(localCheckout, 'lib', FILES[0]))) {
  source = `local checkout: ${localCheckout}`;
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: localCheckout })
      .toString()
      .trim();
  } catch {
    /* not a git checkout — still usable, just unpinned */
  }
  for (const f of FILES) {
    writeFileSync(path.join(VENDOR, f), readFileSync(path.join(localCheckout, 'lib', f)));
    console.log(`copied ${f} from ${localCheckout}`);
  }
} else {
  source = `https://github.com/${REPO}`;
  const head = await fetch(`https://api.github.com/repos/${REPO}/commits/main`);
  if (head.ok) commit = (await head.json()).sha;
  for (const f of FILES) {
    const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${commit}/lib/${f}`);
    if (!res.ok) throw new Error(`fetch ${f}: ${res.status}`);
    writeFileSync(path.join(VENDOR, f), Buffer.from(await res.arrayBuffer()));
    console.log(`downloaded ${f}`);
  }
}

writeFileSync(
  path.join(VENDOR, 'SOURCE.md'),
  `# Vendored from Conduit

These two files are Conduit's committed \`lib/\` build of its embeddable
\`<Terminal/>\` — xterm and its addons inlined, React externalized. Do not edit
them here; change them in Conduit, run \`npm run build:lib\` there, then re-run:

    node scripts/sync-conduit-terminal.mjs

- source: ${source}
- commit: \`${commit}\`
- files: ${FILES.join(', ')}

The hand-written \`conduit-terminal.d.ts\` next to them mirrors Conduit's
\`TerminalProps\` / \`PtyApi\`. If Conduit's contract changes, update it too.
`,
);

console.log(`\nvendored into ${VENDOR}\n  source: ${source}\n  commit: ${commit}`);
