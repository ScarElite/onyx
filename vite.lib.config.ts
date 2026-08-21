import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Library build of the embeddable <Explorer/> component — SEPARATE from the electron-forge
// app build. Bundles the explorer UI; externalizes React so the host (V's Command Hub)
// supplies its own (avoids the duplicate-React crash). Output -> lib/ (NOT dist/, which
// .gitignore excludes) so the prebuilt bundle is committed and the Hub can consume Onyx as
// a git dependency WITHOUT cloning + installing Onyx's devDeps/toolchain (no Electron
// download, no `prepare` build).
//   build:  npm run build:lib   ->   lib/onyx-explorer.js + lib/onyx-explorer.css
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/renderer/Explorer.tsx'),
      formats: ['es'],
      fileName: () => 'onyx-explorer.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      output: { assetFileNames: 'onyx-explorer.[ext]' },
    },
  },
});
