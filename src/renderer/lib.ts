/**
 * The embeddable surface — what a host app gets when it depends on Onyx.
 *
 * `Explorer` alone is not enough to actually mount one: a host also needs the
 * adapter that turns the preload bridge into an `FsApi`, the vlime palette so
 * the panel matches its chrome, and the default settings to seed persistence
 * with. Exporting them from one entry means V's Hub imports `onyx` and nothing
 * else — no deep paths into `dist/`, no copy-pasted palette table drifting out
 * of sync the first time a preset changes.
 *
 * Everything here is renderer-side. The main-process half ships separately as
 * `onyx/main` (it cannot share a bundle: different module format, different
 * externals), and the preload half as `onyx/preload`.
 */
export { Explorer, type ExplorerProps } from './Explorer';
export { createBridgeFsApi, createBridgeTerminalApi, type FsApi, type TerminalApi } from './fs-api';
export { describeContext, type AssistantApi, type AssistantContext } from './assistant';
export { PRESETS, findTheme, applyTheme, xtermTheme } from './themes';
export { DEFAULT_SETTINGS, HOME_PATH, mediaUrl } from '../shared/types';
export type {
  ConflictPolicy,
  DirListing,
  DriveInfo,
  FsEntry,
  FsEvent,
  GitStatus,
  OpProgress,
  OpResult,
  Place,
  PreviewPayload,
  SearchHit,
  SearchQuery,
  Settings,
  Theme,
} from '../shared/types';
