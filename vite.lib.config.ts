import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import postcss, { type AtRule } from 'postcss';
import { resolve } from 'node:path';

/** Class the host puts on the element it mounts <Explorer/> into. */
const SCOPE = '.onyx-root';

/**
 * Scope the emitted stylesheet to `.onyx-root`.
 *
 * `styles.css` is written for an app that owns its whole document: it resets
 * `html, body, #root`, restyles bare `button` and `input`, and paints every
 * scrollbar on the page. Dropped unmodified into V's Hub, that is not theming —
 * it is vandalism. Every button in the Hub would lose its background, and the
 * Hub's layout would fight a `height: 100%` it never asked for.
 *
 * So the library build rewrites the selectors rather than asking the host to
 * live with them. Document-level selectors (`:root`, `html`, `body`, `#root`)
 * collapse onto the mount container — which is what they meant all along, since
 * that container IS the explorer's document. Everything else becomes a
 * descendant of it. Nothing outside the panel can be reached.
 *
 * PostCSS rather than a regex because selector lists, `@media` blocks, and
 * `@keyframes` percentages all look alike to a regex, and only one of the three
 * should be touched.
 */
function scopeCss(): Plugin {
  const rewrite = (css: string): string => {
    const root = postcss.parse(css);
    root.walkRules((rule) => {
      // Keyframe steps ("0%", "from") are not selectors — leave them alone.
      const parent = rule.parent;
      if (parent && parent.type === 'atrule' && /keyframes$/.test((parent as AtRule).name)) return;

      rule.selectors = rule.selectors.map((sel) => {
        const s = sel.trim();
        if (s.startsWith(SCOPE)) return s;
        if (s === ':root' || s === 'html' || s === 'body' || s === '#root') return SCOPE;
        return `${SCOPE} ${s}`;
      });
    });
    return root.toString();
  };

  return {
    name: 'onyx-scope-css',
    // MUST be post: Vite's own `vite:css-post` emits the stylesheet asset from
    // its generateBundle hook, and rollup runs those in plugin order. Without
    // this the rewrite runs against a bundle that has no CSS in it yet, and
    // silently does nothing at all.
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          file.source = rewrite(String(file.source));
        }
      }
    },
  };
}

// Library build of the embeddable <Explorer/> component — SEPARATE from the electron-forge
// app build. Bundles the explorer UI; externalizes React so the host (V's Command Hub)
// supplies its own (avoids the duplicate-React crash). Output -> lib/ (NOT dist/, which
// .gitignore excludes) so the prebuilt bundle is committed and the Hub can consume Onyx as
// a git dependency WITHOUT cloning + installing Onyx's devDeps/toolchain (no Electron
// download, no `prepare` build).
//   build:  npm run build:lib   ->   lib/onyx-explorer.js + lib/onyx-explorer.css
export default defineConfig({
  plugins: [react(), scopeCss()],
  build: {
    outDir: 'lib',
    // The main + preload bundles land in lib/ too, from their own configs.
    // Emptying here would delete whichever of the three built first.
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/renderer/lib.ts'),
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
