import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    // packager appends .ico on Windows — sets the exe + taskbar icon
    icon: 'assets/icons/onyx',
    asar: true,
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
    // Fuses harden the packaged app at build time. Onyx has no native modules
    // (no node-pty until Phase 6), so RunAsNode can stay off — unlike Conduit.
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
