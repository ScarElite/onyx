import { defineConfig } from 'vite';

// node-pty is a native module: it must stay EXTERNAL so its runtime `require`
// of the compiled .node binary keeps working, and so it can be unpacked from
// the asar archive at package time. Everything else (electron-store, etc.) is
// bundled — see the packageAfterCopy hook in forge.config.ts, which copies
// node-pty back into the packaged app after the Vite plugin strips
// node_modules. This is the one dependency worth that dance.
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['node-pty'],
    },
  },
});
