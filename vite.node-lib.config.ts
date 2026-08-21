import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

/**
 * The Node-side halves of the embeddable Onyx: the main-process IPC surface and
 * the preload bridge, built as CommonJS for a host to `require`.
 *
 * Two bundles, not one — a preload and a main process load in different places
 * with different globals, and merging them would drag `child_process` into the
 * sandboxed preload.
 *
 * Both leave `electron` and the node builtins external: they are provided by the
 * runtime, and bundling `electron` would produce a copy of the stub that resolves
 * to nothing. Output goes to lib/ alongside the renderer bundle so the whole
 * embeddable surface is committed and installable with no toolchain.
 *   build:  npm run build:node-lib  ->  lib/onyx-main.cjs + lib/onyx-preload.cjs
 */
export default defineConfig({
  build: {
    outDir: 'lib',
    emptyOutDir: false,
    sourcemap: false,
    // Electron 42 ships Node 22 — no downleveling needed, and none wanted:
    // transpiled optional chaining in main-process code is just noise.
    target: 'node22',
    minify: false,
    lib: {
      entry: {
        'onyx-main': resolve(__dirname, 'src/main/lib.ts'),
        'onyx-preload': resolve(__dirname, 'src/preload/bridge.ts'),
      },
      formats: ['cjs'],
      fileName: (_format, name) => `${name}.cjs`,
    },
    rollupOptions: {
      external: ['electron', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      // A stable name for the code both entries share. The default is content-
      // hashed, which would leave a new orphan `types-<hash>.js` committed in
      // lib/ on every rebuild.
      output: { chunkFileNames: 'onyx-shared.cjs' },
    },
  },
});
