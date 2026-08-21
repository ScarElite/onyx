import { useEffect, useRef, useState } from 'react';
import type { FsEntry, IconSize } from '../../shared/types';
import type { FsApi } from '../fs-api';

/**
 * Real Windows shell icons for the rows currently on screen.
 *
 * Only ever asks for what the caller passes, which in a virtualized list is the
 * ~30 visible rows rather than the whole listing — that is what makes per-path
 * folder icons affordable at all. Main caches by extension for ordinary files,
 * so scrolling through a thousand `.ts` files costs one shell call.
 *
 * Returns a path -> data URL map. A missing key means "not resolved (yet, or at
 * all)"; callers fall back to their own glyph rather than showing a gap.
 */
export function useShellIcons(
  fsApi: FsApi,
  entries: FsEntry[],
  size: IconSize,
  /** Changing this drops everything — pass the folder path. */
  resetKey: string,
): Record<string, string> {
  const [icons, setIcons] = useState<Record<string, string>>({});
  /** Paths already requested, so scrolling doesn't re-ask for the same rows. */
  const asked = useRef(new Set<string>());
  /**
   * Bumped on every folder change. A request carries the generation it started
   * in and drops its result if that has moved on, so a slow lookup for the
   * previous folder can't land in the new one's map.
   */
  const generation = useRef(0);
  /** False only after unmount — NOT between renders. See the note below. */
  const alive = useRef(true);

  useEffect(() => {
    // Set on mount as well as cleared on unmount. StrictMode double-invokes
    // effects (mount -> unmount -> mount) in development, so a cleanup-only
    // version latches `false` on the simulated unmount and never recovers —
    // every icon lookup would then be discarded as "unmounted", in dev only.
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Declared BEFORE the fetch effect so that on the commit where the folder
  // changed, the reset runs first and the fetch below starts from a clean slate.
  useEffect(() => {
    generation.current += 1;
    asked.current = new Set();
    setIcons({});
  }, [resetKey]);

  useEffect(() => {
    const needed = entries
      .filter((e) => !asked.current.has(e.path))
      .map((e) => ({ path: e.path, isDir: e.kind === 'dir' || e.kind === 'junction' }));
    if (needed.length === 0) return;
    for (const n of needed) asked.current.add(n.path);

    const startedIn = generation.current;
    void fsApi.fileIcons(needed, size).then((map) => {
      if (!alive.current || startedIn !== generation.current) return;
      if (Object.keys(map).length === 0) return;
      setIcons((prev) => ({ ...prev, ...map }));
    });

    // Deliberately NO cleanup that cancels this request. `entries` is a fresh
    // array on every render (it's the virtual window), so a per-run cleanup
    // would abort the in-flight lookup on the very next render — and because
    // those paths are already in `asked`, nothing would ever re-request them
    // and no icon would ever appear. The generation check above is what guards
    // against a stale result instead.
  }, [fsApi, entries, size]);

  return icons;
}
