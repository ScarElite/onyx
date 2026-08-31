import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

/**
 * MIME type carrying an internal drag's paths. Set alongside text/plain so the
 * same drag can also land in another application.
 */
export const ONYX_PATHS_MIME = 'application/x-onyx-paths';

/** Read dropped paths from either an internal drag or a drop from Explorer. */
export function readDropPaths(e: React.DragEvent): string[] {
  const internal = e.dataTransfer.getData(ONYX_PATHS_MIME);
  if (internal) {
    try {
      return JSON.parse(internal) as string[];
    } catch {
      return [];
    }
  }
  // File.path was removed in Electron 32+; webUtils (via the preload) is the
  // only supported way to recover a dropped file's real path.
  return [...e.dataTransfer.files].map((f) => window.onyx.getPathForFile(f)).filter(Boolean);
}

/**
 * Paths picked up by the current internal drag. dataTransfer is deliberately
 * unreadable during dragover, so remembering what we picked up is the only way
 * to tell that the folder under the pointer is the folder being dragged.
 */
let dragging: readonly string[] = [];

/** Call from onDragStart, with everything the drag is carrying. */
export function beginDrag(paths: string[]): void {
  dragging = paths;
  // dragend fires on the source element however the drag ends — dropped,
  // cancelled, or dragged out of the window — so nothing goes stale.
  window.addEventListener(
    'dragend',
    () => {
      dragging = [];
    },
    { once: true, capture: true },
  );
}

/** True while `path` is one of the items being dragged right now. */
export function isDragging(path: string): boolean {
  return dragging.includes(path);
}

/**
 * How long a drag has to rest on a folder before Onyx opens it. Long enough
 * that crossing a folder on the way somewhere else doesn't trigger it, short
 * enough to descend four levels without feeling stuck.
 *
 * The fill animation in styles.css (`spring-fill`) must use this duration.
 */
export const SPRING_DELAY_MS = 650;

/**
 * Longest gap between dragover events we still read as "the pointer is still
 * there". Chromium fires dragover continuously while a drag is over the
 * window, so a gap this long means the drag left — and a drag that left must
 * not navigate a pane it merely passed over on the way out.
 */
const SPRING_STALE_MS = 400;

export interface SpringLoad {
  /** Folder currently counting down, for the highlight. */
  path: string | null;
  /** Call from onDragOver with the folder under the pointer, or null. */
  hover: (path: string | null) => void;
  cancel: () => void;
}

/**
 * Spring-loaded folders: holding a drag over a folder opens it, so a file can
 * be walked down a nested path in one gesture instead of being dropped and
 * re-picked-up at every level.
 */
export function useSpringLoad(open: (path: string) => void): SpringLoad {
  const [path, setPath] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const target = useRef<string | null>(null);
  const lastSeen = useRef(0);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    target.current = null;
    setPath(null);
  }, []);

  const hover = useCallback((next: string | null) => {
    lastSeen.current = Date.now();
    // dragover fires many times a second: restart the clock only when the
    // pointer moves to a different folder, or the countdown never finishes.
    if (next === target.current) return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    target.current = next;
    setPath(next);
    timer.current =
      next === null
        ? null
        : window.setTimeout(() => {
            timer.current = null;
            target.current = null;
            setPath(null);
            if (Date.now() - lastSeen.current < SPRING_STALE_MS) openRef.current(next);
          }, SPRING_DELAY_MS);
  }, []);

  // A drop anywhere, or a drag cancelled with Escape, otherwise leaves the
  // countdown running and navigates a pane the user has let go of. Capture
  // phase: the drop handlers below stop propagation before it reaches window.
  useEffect(() => {
    window.addEventListener('drop', cancel, true);
    window.addEventListener('dragend', cancel, true);
    return () => {
      window.removeEventListener('drop', cancel, true);
      window.removeEventListener('dragend', cancel, true);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [cancel]);

  return { path, hover, cancel };
}
