/**
 * The main-process half of the embeddable Onyx — everything a host must run in
 * Node for `<Explorer/>` to have a filesystem underneath it.
 *
 * Separate bundle from `onyx/lib` on purpose: this is CommonJS with `electron`
 * and the node builtins left external, because it is `require`d by an Electron
 * main process, while the renderer half is ESM with React external. One bundle
 * could not satisfy both.
 */
export { registerFsIpc, type FsIpcHost } from './register-fs-ipc';
export {
  ONYX_MEDIA_CSP,
  ONYX_MEDIA_SCHEME,
  handleOnyxMedia,
  registerOnyxMediaScheme,
} from './media-protocol';
export { DEFAULT_SETTINGS, type Settings } from '../shared/types';
