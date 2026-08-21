import { defineConfig } from 'vite';

// Onyx has NO native or externalized runtime deps: electron-store and everything
// else are bundled straight into the main chunk. That matters because the Forge
// Vite plugin excludes node_modules from the packaged app — anything left
// external has to be copied back in by hand (Conduit does exactly that dance for
// node-pty). Keeping the dependency list bundle-able avoids the whole problem.
export default defineConfig({});
