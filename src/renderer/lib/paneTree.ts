import type { PaneLeaf, PaneNode, SortKey } from '../../shared/types';

/**
 * The pane tree: a binary tree of splits with leaves holding a folder each.
 *
 * Every function here is pure and returns a NEW tree — panes live in React
 * state, and in-place mutation is how split-pane UIs end up with stale renders
 * and lost scroll positions.
 */

let counter = 0;
export function newId(prefix = 'p'): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}`;
}

export function makeLeaf(path: string, sortKey: SortKey = 'name'): PaneLeaf {
  return {
    type: 'leaf',
    id: newId(),
    path,
    history: [path],
    historyIndex: 0,
    sortKey,
    sortDir: 'asc',
    viewMode: 'details',
    filter: '',
  };
}

export function collectLeaves(node: PaneNode): PaneLeaf[] {
  if (node.type === 'leaf') return [node];
  return [...collectLeaves(node.a), ...collectLeaves(node.b)];
}

export function findLeaf(node: PaneNode, id: string): PaneLeaf | null {
  if (node.type === 'leaf') return node.id === id ? node : null;
  return findLeaf(node.a, id) ?? findLeaf(node.b, id);
}

export function firstLeaf(node: PaneNode): PaneLeaf {
  return node.type === 'leaf' ? node : firstLeaf(node.a);
}

/** Replace one leaf's fields, leaving the rest of the tree identical. */
export function updateLeaf(
  node: PaneNode,
  id: string,
  patch: (leaf: PaneLeaf) => PaneLeaf,
): PaneNode {
  if (node.type === 'leaf') return node.id === id ? patch(node) : node;
  const a = updateLeaf(node.a, id, patch);
  const b = updateLeaf(node.b, id, patch);
  // Preserve referential identity when nothing below changed, so React can skip
  // re-rendering the untouched half of a split.
  if (a === node.a && b === node.b) return node;
  return { ...node, a, b };
}

/** Split `id` in two, putting a fresh leaf beside it. Returns the new leaf too. */
export function splitLeaf(
  node: PaneNode,
  id: string,
  dir: 'h' | 'v',
  path: string,
): { tree: PaneNode; created: PaneLeaf | null } {
  let created: PaneLeaf | null = null;

  const walk = (n: PaneNode): PaneNode => {
    if (n.type === 'leaf') {
      if (n.id !== id) return n;
      // The new pane opens on the same folder — splitting is for comparing and
      // moving between two views, and starting from "here" is the useful default.
      created = makeLeaf(path, n.sortKey);
      return { type: 'split', id: newId('s'), dir, ratio: 0.5, a: n, b: created };
    }
    const a = walk(n.a);
    const b = a === n.a ? walk(n.b) : n.b;
    if (a === n.a && b === n.b) return n;
    return { ...n, a, b };
  };

  return { tree: walk(node), created };
}

/**
 * Remove a leaf, collapsing its parent split into the surviving sibling.
 * Returns null when `id` was the last leaf — the caller closes the tab.
 */
export function closeLeaf(node: PaneNode, id: string): PaneNode | null {
  if (node.type === 'leaf') return node.id === id ? null : node;
  const a = closeLeaf(node.a, id);
  const b = closeLeaf(node.b, id);
  if (a === null) return b;
  if (b === null) return a;
  if (a === node.a && b === node.b) return node;
  return { ...node, a, b };
}

export function setRatio(node: PaneNode, splitId: string, ratio: number): PaneNode {
  if (node.type === 'leaf') return node;
  if (node.id === splitId) {
    return { ...node, ratio: Math.min(0.9, Math.max(0.1, ratio)) };
  }
  const a = setRatio(node.a, splitId, ratio);
  const b = setRatio(node.b, splitId, ratio);
  if (a === node.a && b === node.b) return node;
  return { ...node, a, b };
}

/**
 * Navigate a leaf to a new path, maintaining browser-style history: moving after
 * going Back truncates the forward entries, and re-navigating to where you
 * already are is a no-op rather than a duplicate history entry.
 */
export function navigateLeaf(leaf: PaneLeaf, path: string): PaneLeaf {
  if (leaf.path === path) return leaf;
  const history = [...leaf.history.slice(0, leaf.historyIndex + 1), path];
  // Cap the history so a long session can't grow it without bound.
  const trimmed = history.length > 200 ? history.slice(history.length - 200) : history;
  return {
    ...leaf,
    path,
    history: trimmed,
    historyIndex: trimmed.length - 1,
    // A filter belongs to the folder you typed it in, not to the pane forever.
    filter: '',
  };
}

export function goBack(leaf: PaneLeaf): PaneLeaf {
  if (leaf.historyIndex <= 0) return leaf;
  const i = leaf.historyIndex - 1;
  return { ...leaf, historyIndex: i, path: leaf.history[i], filter: '' };
}

export function goForward(leaf: PaneLeaf): PaneLeaf {
  if (leaf.historyIndex >= leaf.history.length - 1) return leaf;
  const i = leaf.historyIndex + 1;
  return { ...leaf, historyIndex: i, path: leaf.history[i], filter: '' };
}

/** The pane "next to" this one — the target for F5/F6 commander transfers. */
export function siblingLeafId(node: PaneNode, id: string): string | null {
  const leaves = collectLeaves(node);
  if (leaves.length < 2) return null;
  const i = leaves.findIndex((l) => l.id === id);
  if (i === -1) return null;
  return leaves[(i + 1) % leaves.length].id;
}
