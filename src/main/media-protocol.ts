import { net, protocol } from 'electron';
import { pathToFileURL } from 'node:url';

import { isAbsolute, normalize } from './fs-service';

/**
 * The `onyx-media:` scheme — how preview bytes reach the renderer.
 *
 * `file:` does not work for this and cannot be made to: in dev the renderer's
 * origin is the Vite dev server, and Chromium blocks a cross-origin `file:`
 * fetch no matter what the CSP says (handoff §9.11). A custom scheme sidesteps
 * that, streams range requests so video scrubbing works, and keeps exactly one
 * auditable place where a path turns into readable bytes.
 *
 * Both hosts need it — the standalone app and V's Hub — so the registration
 * lives here rather than inline in `main.ts`. Note the two halves must be called
 * at different times: `ONYX_MEDIA_SCHEME` before `app.whenReady()`, the handler
 * after.
 */
export const ONYX_MEDIA_SCHEME = {
  scheme: 'onyx-media',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
} as const;

/** Register the scheme as privileged. MUST run before the app is ready. */
export function registerOnyxMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([ONYX_MEDIA_SCHEME]);
}

/** Wire the handler. MUST run after the app is ready. */
export function handleOnyxMedia(): void {
  protocol.handle(ONYX_MEDIA_SCHEME.scheme, (request) => {
    const target = new URL(request.url).searchParams.get('p');
    if (!target) return new Response('Bad request', { status: 400 });
    const resolved = normalize(target);
    if (!isAbsolute(resolved)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(resolved).toString(), { bypassCustomProtocolHandlers: true });
  });
}

/**
 * The CSP directives a host must allow for previews to render. Returned as data
 * rather than a string so a host can splice them into a policy it already has —
 * V's Hub has its own, and silently overwriting it would break the Hub's chrome.
 */
export const ONYX_MEDIA_CSP = {
  'img-src': 'data: blob: onyx-media:',
  'media-src': 'blob: onyx-media:',
  'frame-src': 'onyx-media:',
  'connect-src': 'onyx-media:',
} as const;
