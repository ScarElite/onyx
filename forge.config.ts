import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';
import fs from 'node:fs';

const config: ForgeConfig = {
  packagerConfig: {
    // packager appends .ico on Windows — sets the exe + taskbar icon
    icon: 'assets/icons/onyx',
    // node-pty is a native module loaded via require() at runtime, so its files
    // (and the .node binary) must be unpacked out of the asar archive.
    asar: {
      unpack: '**/node_modules/node-pty/**',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: 'assets/icons/onyx.ico',
      setupExe: 'OnyxSetup.exe',
    }),
    new MakerZIP({}, ['darwin']),
  ],
  publishers: [
    // `npm run publish` uploads the Squirrel artifacts (RELEASES, .nupkg,
    // OnyxSetup.exe) to a GitHub Release tagged v<version>. Installed copies
    // pull updates from that release via update.electronjs.org, which only
    // serves PUBLIC repos with published (non-draft) releases.
    new PublisherGithub({
      repository: { owner: 'ScarElite', name: 'onyx' },
      draft: false,
      prerelease: false,
      generateReleaseNotes: true,
    }),
  ],
  hooks: {
    // The Vite plugin bundles the app and excludes node_modules from the copied
    // package — which drops node-pty (intentionally left external in
    // vite.main.config.ts). Copy it back so it can be unpacked + required at
    // runtime. node-pty's only dependency (node-addon-api) is build-time only
    // and vendored inside node-pty, so copying the folder is self-contained.
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      const src = path.join(__dirname, 'node_modules', 'node-pty');
      const dest = path.join(buildPath, 'node_modules', 'node-pty');
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.cp(src, dest, { recursive: true });
    },
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses harden the packaged app at build time.
    new FusesPlugin({
      version: FuseVersion.V1,
      // node-pty's ConPTY child-process reaping forks the binary as Node
      // (ELECTRON_RUN_AS_NODE) to enumerate + kill the shell's process tree, so
      // this must stay true now that the terminal dock exists. The hardening
      // delta is marginal for an app that already spawns arbitrary user shells.
      [FuseV1Options.RunAsNode]: true,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
