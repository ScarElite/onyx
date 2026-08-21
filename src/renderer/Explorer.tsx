import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConflictPolicy,
  DirListing,
  DriveInfo,
  FsEntry,
  OpProgress,
  OpResult,
  PaneLeaf,
  Place,
  SessionState,
  Settings,
  SortKey,
  TabState,
  Theme,
} from '../shared/types';
import type { FsApi, TerminalApi } from './fs-api';
import type { AssistantApi } from './assistant';
import { basename, formatBytes } from './lib/format';
import {
  closeLeaf,
  collectLeaves,
  findLeaf,
  firstLeaf,
  goBack,
  goForward,
  makeLeaf,
  navigateLeaf,
  newId,
  setRatio,
  siblingLeafId,
  splitLeaf,
  updateLeaf,
} from './lib/paneTree';
import { BatchRename } from './components/BatchRename';
import { CommandPalette, type PaletteItem } from './components/CommandPalette';
import { FilePane } from './components/FilePane';
import { PaneTreeView } from './components/PaneTree';
import { Peek, PreviewPane } from './components/PreviewPane';
import { Sidebar } from './components/Sidebar';
import { TabStrip } from './components/TabStrip';
import { TerminalDock } from './components/TerminalDock';
import { AskV } from './components/AskV';
import { ContextMenu, useDialogs, type MenuItem } from './components/ui';
// Imported HERE, not only in renderer.tsx, so `npm run build:lib` emits a
// stylesheet alongside the component. A host that drops <Explorer/> in gets the
// chrome with it instead of having to reproduce 1,200 lines of CSS.
import './styles.css';

export interface ExplorerProps {
  fsApi: FsApi;
  /**
   * Optional: without it, no terminal dock is rendered. A host may have a
   * filesystem but no shell — or its own, as V's Hub does.
   */
  terminalApi?: TerminalApi;
  /**
   * Optional: without it, "Ask V" is hidden. The Hub would inject an adapter
   * over the brain connection it already holds rather than opening a second.
   */
  assistant?: AssistantApi;
  /** The resolved theme, needed to colour the docked terminal's xterm palette. */
  theme: Theme;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  /** Where a fresh session starts. Ignored when a saved session is restored. */
  initialPath: string;
  /** Rendered by the host (the standalone app opens its own settings modal). */
  onOpenSettings?: () => void;
  /** Lets the host chrome show the active folder in the title bar. */
  onActivePathChange?: (path: string) => void;
}

interface PaneData {
  listing: DirListing | null;
  entries: FsEntry[];
}

/**
 * The whole explorer: sidebar, tabs, the pane tree, preview, palette, and every
 * command. HOST-AGNOSTIC — it imports no `electron`, no `window.onyx`, no `fs`.
 * Everything it can do arrives through the injected `fsApi` (see fs-api.ts), so
 * the same component runs as the standalone app and as a panel inside V's Hub.
 */
export function Explorer({
  fsApi,
  terminalApi,
  assistant,
  theme,
  settings,
  onSettingsChange,
  initialPath,
  onOpenSettings,
  onActivePathChange,
}: ExplorerProps): React.JSX.Element {
  const [session, setSession] = useState<SessionState>(() => restoreSession(settings, initialPath));
  const [selections, setSelections] = useState<Record<string, { paths: string[]; cursor: string | null }>>({});
  const [paneData, setPaneData] = useState<Record<string, PaneData>>({});
  const [cutPaths, setCutPaths] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [palette, setPalette] = useState<'paths' | 'actions' | null>(null);
  const [peekPath, setPeekPath] = useState<string | null>(null);
  const [batchTargets, setBatchTargets] = useState<FsEntry[] | null>(null);
  const [searchPanes, setSearchPanes] = useState<Set<string>>(new Set());
  const [askOpen, setAskOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [progress, setProgress] = useState<OpProgress | null>(null);
  const [undoText, setUndoText] = useState<string | null>(null);
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [known, setKnown] = useState<Place[]>([]);

  const { ask, confirm, choose, node: dialogNode } = useDialogs();
  /** Bumped per pane by Ctrl+R (or the refresh button) to force a re-read. */
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  /**
   * Ctrl+F focuses the active pane's filter input. The input is found in the DOM
   * by pane id rather than threaded up through a ref: panes mount and unmount as
   * splits open and close, and a ref registry would have to be kept in sync with
   * the tree for no benefit.
   */
  const focusFilter = useCallback((paneId: string) => {
    document.querySelector<HTMLInputElement>(`[data-pane-filter="${paneId}"]`)?.focus();
  }, []);

  /* ---------------------------------------------------------------- *
   * Derived state
   * ---------------------------------------------------------------- */

  const activeTab = useMemo(
    () => session.tabs.find((t) => t.id === session.activeTabId) ?? session.tabs[0],
    [session],
  );
  const activeLeaf = useMemo(
    () => findLeaf(activeTab.root, activeTab.activePaneId) ?? firstLeaf(activeTab.root),
    [activeTab],
  );
  const activeSelection = selections[activeLeaf.id] ?? { paths: [], cursor: null };
  const activeData = paneData[activeLeaf.id] ?? { listing: null, entries: [] };
  const paneCount = collectLeaves(activeTab.root).length;

  const selectedEntries = useMemo(
    () => activeData.entries.filter((e) => activeSelection.paths.includes(e.path)),
    [activeData.entries, activeSelection.paths],
  );

  useEffect(() => onActivePathChange?.(activeLeaf.path), [activeLeaf.path, onActivePathChange]);

  /* ---------------------------------------------------------------- *
   * Wiring
   * ---------------------------------------------------------------- */

  useEffect(() => {
    void fsApi.drives().then(setDrives);
    void fsApi.knownFolders().then(setKnown);
  }, [fsApi]);

  useEffect(() => fsApi.onOpProgress((p) => setProgress(p.done ? null : p)), [fsApi]);

  useEffect(() => {
    void fsApi.undoLabel().then(setUndoText);
  }, [fsApi, paneData]);

  // Persist the session, debounced — a pane resize fires this on every mousemove.
  useEffect(() => {
    const timer = setTimeout(() => onSettingsChange({ session }), 500);
    return () => clearTimeout(timer);
  }, [session, onSettingsChange]);

  const flash = useCallback((text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast((cur) => (cur?.text === text ? null : cur)), 4200);
  }, []);

  /** Report an OpResult to the user: only failures are worth interrupting for. */
  const report = useCallback(
    (result: OpResult, successText?: string) => {
      if (!result.ok) {
        const detail = result.failures?.[0]?.error;
        flash(detail ? `${result.error ?? 'Failed'} — ${detail}` : (result.error ?? 'Failed'), true);
      } else if (successText) {
        flash(successText);
      }
      setUndoText(result.undoLabel ?? null);
      return result.ok;
    },
    [flash],
  );

  /* ---------------------------------------------------------------- *
   * Tab + pane mutation
   * ---------------------------------------------------------------- */

  const mutateTab = useCallback(
    (tabId: string, fn: (tab: TabState) => TabState) => {
      setSession((s) => ({ ...s, tabs: s.tabs.map((t) => (t.id === tabId ? fn(t) : t)) }));
    },
    [],
  );

  const patchLeaf = useCallback(
    (paneId: string, patch: (leaf: PaneLeaf) => PaneLeaf) => {
      setSession((s) => ({
        ...s,
        tabs: s.tabs.map((t) => ({ ...t, root: updateLeaf(t.root, paneId, patch) })),
      }));
    },
    [],
  );

  const navigate = useCallback(
    (paneId: string, path: string) => {
      patchLeaf(paneId, (leaf) => navigateLeaf(leaf, path));
      setSelections((prev) => ({ ...prev, [paneId]: { paths: [], cursor: null } }));
    },
    [patchLeaf],
  );

  const newTab = useCallback(
    (path?: string) => {
      const leaf = makeLeaf(path ?? activeLeaf.path);
      const tab: TabState = { id: newId('t'), root: leaf, activePaneId: leaf.id };
      setSession((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
    },
    [activeLeaf.path],
  );

  const closeTab = useCallback((tabId: string) => {
    setSession((s) => {
      if (s.tabs.length === 1) return s; // never leave the window empty
      const index = s.tabs.findIndex((t) => t.id === tabId);
      const tabs = s.tabs.filter((t) => t.id !== tabId);
      const activeTabId =
        s.activeTabId === tabId ? tabs[Math.min(index, tabs.length - 1)].id : s.activeTabId;
      return { tabs, activeTabId };
    });
  }, []);

  const splitPane = useCallback(
    (dir: 'h' | 'v') => {
      mutateTab(activeTab.id, (tab) => {
        const { tree, created } = splitLeaf(tab.root, tab.activePaneId, dir, activeLeaf.path);
        return { ...tab, root: tree, activePaneId: created ? created.id : tab.activePaneId };
      });
    },
    [mutateTab, activeTab.id, activeLeaf.path],
  );

  const closePane = useCallback(() => {
    if (paneCount === 1) {
      closeTab(activeTab.id);
      return;
    }
    mutateTab(activeTab.id, (tab) => {
      const root = closeLeaf(tab.root, tab.activePaneId);
      if (!root) return tab;
      return { ...tab, root, activePaneId: firstLeaf(root).id };
    });
  }, [paneCount, closeTab, activeTab.id, mutateTab]);

  const activatePane = useCallback(
    (paneId: string) => {
      if (activeTab.activePaneId === paneId) return;
      mutateTab(activeTab.id, (tab) => ({ ...tab, activePaneId: paneId }));
    },
    [activeTab.activePaneId, activeTab.id, mutateTab],
  );

  const handleListing = useCallback(
    (paneId: string, listing: DirListing | null, entries: FsEntry[]) => {
      setPaneData((prev) => {
        const cur = prev[paneId];
        if (cur && cur.listing === listing && cur.entries === entries) return prev;
        return { ...prev, [paneId]: { listing, entries } };
      });
    },
    [],
  );

  const handleSelection = useCallback((paneId: string, paths: string[], cursor: string | null) => {
    setSelections((prev) => ({ ...prev, [paneId]: { paths, cursor } }));
  }, []);

  /* ---------------------------------------------------------------- *
   * File operations
   * ---------------------------------------------------------------- */

  /**
   * Decide what happens to files that already exist at the destination.
   *
   * Asked UP FRONT rather than mid-operation: a prompt halfway through a copy
   * would leave a half-finished result behind if the user cancelled. When
   * nothing collides the user is never bothered at all.
   */
  const resolvePolicy = useCallback(
    async (srcs: string[], destDir: string, verb: string): Promise<ConflictPolicy | null> => {
      const clashes = await fsApi.conflicts(srcs, destDir);
      if (clashes.length === 0) return 'keepBoth';
      const answer = await choose({
        title: `${clashes.length} item${clashes.length === 1 ? '' : 's'} already there`,
        message: `${basename(destDir)} already contains these. What should ${verb} do?`,
        items: clashes,
        choices: [
          { id: 'keepBoth', label: 'Keep both', primary: true, hint: 'Adds " (2)" to the incoming copy. Nothing is lost.' },
          { id: 'skip', label: 'Skip', hint: 'Leaves the existing files alone and transfers only the rest.' },
          { id: 'overwrite', label: 'Overwrite', danger: true, hint: 'Replaces the existing files. This cannot be undone.' },
        ],
      });
      return (answer as ConflictPolicy | null) ?? null;
    },
    [fsApi, choose],
  );

  const openEntry = useCallback(
    async (entry: FsEntry) => {
      const result = await fsApi.open(entry.path);
      if (!result.ok) flash(result.error ?? `Could not open ${entry.name}`, true);
    },
    [fsApi, flash],
  );

  const dropPaths = useCallback(
    async (paths: string[], destDir: string, copy: boolean) => {
      const policy = await resolvePolicy(paths, destDir, copy ? 'the copy' : 'the move');
      if (!policy) return; // dismissed
      const result = copy
        ? await fsApi.copy(paths, destDir, policy)
        : await fsApi.move(paths, destDir, policy);
      report(result, `${copy ? 'Copied' : 'Moved'} ${paths.length} to ${basename(destDir)}`);
    },
    [fsApi, report, resolvePolicy],
  );

  const doCopy = useCallback(() => {
    if (activeSelection.paths.length === 0) return;
    void fsApi.clipboardCopyPaths(activeSelection.paths);
    setCutPaths(new Set());
    flash(`Copied ${activeSelection.paths.length} item(s)`);
  }, [fsApi, activeSelection.paths, flash]);

  const doCut = useCallback(() => {
    if (activeSelection.paths.length === 0) return;
    void fsApi.clipboardCutPaths(activeSelection.paths);
    setCutPaths(new Set(activeSelection.paths));
    flash(`Cut ${activeSelection.paths.length} item(s)`);
  }, [fsApi, activeSelection.paths, flash]);

  const doPaste = useCallback(async () => {
    const clip = await fsApi.clipboardReadPaths();
    if (clip.paths.length === 0) {
      flash('Clipboard is empty', true);
      return;
    }
    const policy = await resolvePolicy(clip.paths, activeLeaf.path, 'the paste');
    if (!policy) return;
    const result = clip.cut
      ? await fsApi.move(clip.paths, activeLeaf.path, policy)
      : await fsApi.copy(clip.paths, activeLeaf.path, policy);
    if (clip.cut) setCutPaths(new Set());
    report(result, `${clip.cut ? 'Moved' : 'Copied'} ${clip.paths.length} item(s) here`);
  }, [fsApi, activeLeaf.path, report, flash, resolvePolicy]);

  const doDelete = useCallback(
    async (permanent: boolean) => {
      const targets = activeSelection.paths;
      if (targets.length === 0) return;
      const toTrash = settings.deleteToTrash && !permanent;

      if (settings.confirmDelete || !toTrash) {
        const ok = await confirm({
          title: toTrash ? 'Move to Recycle Bin' : 'Delete permanently',
          message: toTrash
            ? `Move ${targets.length} item${targets.length === 1 ? '' : 's'} to the Recycle Bin?`
            : `Permanently delete ${targets.length} item${targets.length === 1 ? '' : 's'}? This cannot be undone.`,
          items: targets.map((p) => basename(p)),
          confirmLabel: toTrash ? 'Move to Bin' : 'Delete forever',
          danger: !toTrash,
        });
        if (!ok) return;
      }

      const result = await fsApi.remove(targets, toTrash);
      handleSelection(activeLeaf.id, [], null);
      report(result, toTrash ? `${targets.length} item(s) in the Recycle Bin` : undefined);
    },
    [activeSelection.paths, settings.deleteToTrash, settings.confirmDelete, confirm, fsApi, handleSelection, activeLeaf.id, report],
  );

  const doNewFolder = useCallback(async () => {
    const name = await ask({
      title: 'New folder',
      label: `In ${activeLeaf.path}`,
      initial: 'New folder',
      confirmLabel: 'Create',
    });
    if (!name) return;
    const result = await fsApi.mkdir(activeLeaf.path, name);
    if (report(result) && result.affected?.[0]) {
      handleSelection(activeLeaf.id, result.affected, result.affected[0]);
      // Drop straight into renaming so the name can be typed over immediately.
      setRenaming(result.affected[0]);
    }
  }, [ask, activeLeaf.path, activeLeaf.id, fsApi, report, handleSelection]);

  const doNewFile = useCallback(async () => {
    const name = await ask({
      title: 'New file',
      label: `In ${activeLeaf.path}`,
      initial: 'untitled.txt',
      confirmLabel: 'Create',
      selectStem: true,
    });
    if (!name) return;
    report(await fsApi.newFile(activeLeaf.path, name));
  }, [ask, activeLeaf.path, fsApi, report]);

  const doRenameCommit = useCallback(
    async (path: string, newName: string) => {
      setRenaming(null);
      report(await fsApi.rename(path, newName));
    },
    [fsApi, report],
  );

  const doUndo = useCallback(async () => {
    const result = await fsApi.undo();
    // Undo failing is not an error the user caused — it is usually the honest
    // "that was a Recycle Bin delete" message, so it is shown either way.
    if (!result.ok) flash(result.error ?? 'Nothing to undo', true);
    else flash('Undone');
    setUndoText(result.undoLabel ?? null);
  }, [fsApi, flash]);

  /** F5 / F6 — the commander transfer to the pane next door. */
  const transferToSibling = useCallback(
    async (copy: boolean) => {
      const siblingId = siblingLeafId(activeTab.root, activeLeaf.id);
      if (!siblingId) {
        flash('Split the tab first (Ctrl+\\) to transfer between panes', true);
        return;
      }
      if (activeSelection.paths.length === 0) return;
      const sibling = findLeaf(activeTab.root, siblingId);
      if (!sibling) return;
      const policy = await resolvePolicy(
        activeSelection.paths,
        sibling.path,
        copy ? 'the copy' : 'the move',
      );
      if (!policy) return;
      const result = copy
        ? await fsApi.copy(activeSelection.paths, sibling.path, policy)
        : await fsApi.move(activeSelection.paths, sibling.path, policy);
      report(
        result,
        `${copy ? 'Copied' : 'Moved'} ${activeSelection.paths.length} to ${basename(sibling.path)}`,
      );
    },
    [activeTab.root, activeLeaf.id, activeSelection.paths, fsApi, report, flash, resolvePolicy],
  );

  const pinCurrent = useCallback(() => {
    const path = activeLeaf.path;
    if (settings.pinned.some((p) => p.path.toLowerCase() === path.toLowerCase())) {
      flash('Already pinned');
      return;
    }
    onSettingsChange({ pinned: [...settings.pinned, { name: basename(path) || path, path }] });
  }, [activeLeaf.path, settings.pinned, onSettingsChange, flash]);

  const unpin = useCallback(
    (path: string) => {
      onSettingsChange({ pinned: settings.pinned.filter((p) => p.path !== path) });
    },
    [settings.pinned, onSettingsChange],
  );

  /* ---------------------------------------------------------------- *
   * Commands (palette + keyboard + context menu all use these)
   * ---------------------------------------------------------------- */

  /**
   * The shell moved (a plain `cd`), so the pane follows. This closes the loop
   * with the pane -> shell direction; it terminates because both sides no-op
   * when the path already matches.
   */
  const handleShellCwd = useCallback(
    (path: string) => navigate(activeLeaf.id, path),
    [navigate, activeLeaf.id],
  );

  const toggleTerminal = useCallback(() => {
    onSettingsChange({ terminalVisible: !settings.terminalVisible });
  }, [onSettingsChange, settings.terminalVisible]);

  const toggleSearch = useCallback((paneId: string) => {
    setSearchPanes((prev) => {
      const next = new Set(prev);
      if (next.has(paneId)) next.delete(paneId);
      else next.add(paneId);
      return next;
    });
  }, []);

  const commands = useMemo<PaletteItem[]>(() => {
    const items: { label: string; hint?: string; run: () => void }[] = [
      { label: 'New tab', hint: 'Ctrl+T', run: () => newTab() },
      { label: 'Close tab', hint: 'Ctrl+W', run: () => closeTab(activeTab.id) },
      { label: 'Split pane right', hint: 'Ctrl+\\', run: () => splitPane('h') },
      { label: 'Split pane down', hint: 'Ctrl+Shift+\\', run: () => splitPane('v') },
      { label: 'Close pane', run: closePane },
      { label: 'New folder', hint: 'Ctrl+N', run: () => void doNewFolder() },
      { label: 'New file', run: () => void doNewFile() },
      { label: 'Search in this folder', hint: 'Ctrl+Shift+F', run: () => toggleSearch(activeLeaf.id) },
      {
        label: `Switch to ${activeLeaf.viewMode === 'grid' ? 'details' : 'grid'} view`,
        run: () =>
          patchLeaf(activeLeaf.id, (l) => ({
            ...l,
            viewMode: l.viewMode === 'grid' ? 'details' : 'grid',
          })),
      },
      { label: 'Batch rename selection', hint: 'Shift+F2', run: () => setBatchTargets(selectedEntries) },
      { label: 'Copy paths to clipboard', run: () => fsApi.copyText(activeSelection.paths.join('\r\n')) },
      ...(terminalApi
        ? [
            {
              label: `${settings.terminalVisible ? 'Hide' : 'Show'} the docked terminal`,
              hint: 'Ctrl+`',
              run: toggleTerminal,
            },
          ]
        : []),
      ...(assistant
        ? [
            {
              label: `Ask ${assistant.name} about the selection`,
              hint: 'Ctrl+Shift+A',
              run: () => setAskOpen(true),
            },
          ]
        : []),
      { label: 'Open in Windows Terminal', run: () => void fsApi.openTerminalAt(activeLeaf.path) },
      { label: 'Reveal in File Explorer', run: () => void fsApi.revealInExplorer(activeLeaf.path) },
      { label: 'Pin this folder', run: pinCurrent },
      { label: `${settings.showHidden ? 'Hide' : 'Show'} hidden items`, hint: 'Ctrl+H', run: () => onSettingsChange({ showHidden: !settings.showHidden }) },
      { label: `${settings.previewVisible ? 'Hide' : 'Show'} preview pane`, run: () => onSettingsChange({ previewVisible: !settings.previewVisible }) },
      { label: `${settings.sidebarVisible ? 'Hide' : 'Show'} sidebar`, run: () => onSettingsChange({ sidebarVisible: !settings.sidebarVisible }) },
      { label: `${settings.showFolderSizes ? 'Stop showing' : 'Show'} real folder sizes`, run: () => onSettingsChange({ showFolderSizes: !settings.showFolderSizes }) },
      { label: 'Undo last file operation', hint: 'Ctrl+Z', run: () => void doUndo() },
    ];
    if (onOpenSettings) items.push({ label: 'Settings', hint: 'Ctrl+,', run: onOpenSettings });
    return items.map((item, i) => ({ id: `cmd${i}`, ...item }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab.id, activeLeaf.id, activeLeaf.path, selectedEntries, activeSelection.paths,
    settings.showHidden, settings.previewVisible, settings.sidebarVisible, settings.showFolderSizes,
    settings.terminalVisible, terminalApi, toggleTerminal, assistant,
    activeLeaf.viewMode, patchLeaf,
    newTab, closeTab, splitPane, closePane, doNewFolder, doNewFile, pinCurrent, doUndo,
    onSettingsChange, onOpenSettings, fsApi,
  ]);

  /** Fuzzy path targets: pins, known folders, drives, and this pane's history. */
  const pathItems = useMemo<PaletteItem[]>(() => {
    const seen = new Set<string>();
    const out: PaletteItem[] = [];
    const push = (label: string, path: string, hint: string) => {
      const key = path.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ id: key, label: path, hint, run: () => navigate(activeLeaf.id, path) });
      void label;
    };
    for (const p of settings.pinned) push(p.name, p.path, 'pinned');
    for (const p of known) push(p.name, p.path, 'quick access');
    for (const d of drives) push(d.label, d.path, 'drive');
    for (const leaf of collectLeaves(activeTab.root)) {
      for (const h of [...leaf.history].reverse()) push(basename(h), h, 'recent');
    }
    for (const entry of activeData.entries) {
      if (entry.kind === 'dir') push(entry.name, entry.path, 'here');
    }
    return out;
  }, [settings.pinned, known, drives, activeTab.root, activeData.entries, navigate, activeLeaf.id]);

  /** Let the palette jump to a literally-typed path that isn't in the list. */
  const resolveTypedPath = useCallback(
    async (query: string): Promise<PaletteItem[]> => {
      if (query.trim().length < 2) return [];
      const resolved = await fsApi.resolvePath(query, activeLeaf.path);
      if (!resolved) return [];
      return [
        {
          id: `typed:${resolved}`,
          label: resolved,
          hint: 'go',
          run: () => navigate(activeLeaf.id, resolved),
        },
      ];
    },
    [fsApi, activeLeaf.path, activeLeaf.id, navigate],
  );

  /* ---------------------------------------------------------------- *
   * Keyboard
   * ---------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      // Modals own the keyboard while they are open.
      if (palette || batchTargets || peekPath || askOpen) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Split uses e.code, not e.key: Shift+Backslash produces "|" on a US
      // layout, so matching on the character would break Ctrl+Shift+\ entirely.
      if (ctrl && e.code === 'Backslash') {
        e.preventDefault();
        return splitPane(e.shiftKey ? 'v' : 'h');
      }

      // Ctrl+` toggles the terminal dock. Backquote via e.code so the shifted
      // character (~) doesn't matter.
      if (ctrl && e.code === 'Backquote' && terminalApi) {
        e.preventDefault();
        return toggleTerminal();
      }

      // Ctrl+1..9 focuses a pane by position.
      if (ctrl && !e.shiftKey && /^Digit[1-9]$/.test(e.code)) {
        const leaves = collectLeaves(activeTab.root);
        const target = leaves[Number(e.code.slice(5)) - 1];
        if (target) {
          e.preventDefault();
          return activatePane(target.id);
        }
      }

      if (ctrl && !e.shiftKey) {
        // Shortcuts that stay live while a text field has focus — these are
        // window-level and have no meaning inside an input.
        switch (e.key.toLowerCase()) {
          case 't': e.preventDefault(); return newTab();
          case 'w': e.preventDefault(); return closeTab(activeTab.id);
          case 'p': e.preventDefault(); return setPalette('paths');
          case 'f': e.preventDefault(); return focusFilter(activeLeaf.id);
          case 'r':
            e.preventDefault();
            return setRefreshKeys((k) => ({ ...k, [activeLeaf.id]: (k[activeLeaf.id] ?? 0) + 1 }));
          case '0': e.preventDefault(); return onSettingsChange({ fontSizeOffset: 0 });
          case '=':
          case '+': e.preventDefault(); return onSettingsChange({ fontSizeOffset: Math.min(8, settings.fontSizeOffset + 1) });
          case '-': e.preventDefault(); return onSettingsChange({ fontSizeOffset: Math.max(-3, settings.fontSizeOffset - 1) });
          case ',': e.preventDefault(); return onOpenSettings?.();
          default: break;
        }
        // The rest would fight the text field: Ctrl+Z must undo typing, and
        // Ctrl+C/X/V must act on the text, not on the file selection.
        if (!typing) {
          switch (e.key.toLowerCase()) {
            case 'n': e.preventDefault(); return void doNewFolder();
            case 'h': e.preventDefault(); return onSettingsChange({ showHidden: !settings.showHidden });
            case 'z': e.preventDefault(); return void doUndo();
            case 'c': e.preventDefault(); return doCopy();
            case 'x': e.preventDefault(); return doCut();
            case 'v': e.preventDefault(); return void doPaste();
            default: break;
          }
        }
      }

      if (ctrl && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'p': e.preventDefault(); return setPalette('actions');
          case 'f': e.preventDefault(); return toggleSearch(activeLeaf.id);
          case 'a':
            if (!assistant) break;
            e.preventDefault();
            return setAskOpen(true);
          default: break;
        }
      }

      if (ctrl && e.key === 'Tab') {
        e.preventDefault();
        const i = session.tabs.findIndex((t) => t.id === activeTab.id);
        const next = session.tabs[(i + (e.shiftKey ? -1 : 1) + session.tabs.length) % session.tabs.length];
        return setSession((s) => ({ ...s, activeTabId: next.id }));
      }

      if (typing) return;

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        return patchLeaf(activeLeaf.id, goBack);
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        return patchLeaf(activeLeaf.id, goForward);
      }

      switch (e.key) {
        case 'Backspace': {
          e.preventDefault();
          void fsApi.parentOf(activeLeaf.path).then((p) => p && navigate(activeLeaf.id, p));
          return;
        }
        case 'Delete':
          e.preventDefault();
          return void doDelete(e.shiftKey);
        case 'F2':
          e.preventDefault();
          if (e.shiftKey) {
            if (selectedEntries.length > 0) setBatchTargets(selectedEntries);
            return;
          }
          if (activeSelection.cursor) setRenaming(activeSelection.cursor);
          return;
        case 'F5':
          e.preventDefault();
          return void transferToSibling(true);
        case 'F6':
          e.preventDefault();
          return void transferToSibling(false);
        case ' ':
          if (activeSelection.cursor) {
            e.preventDefault();
            setPeekPath(activeSelection.cursor);
          }
          return;
        case 'Escape':
          setCutPaths(new Set());
          return;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    palette, batchTargets, peekPath, askOpen, activeTab.id, activeLeaf.id, activeLeaf.path,
    session.tabs, settings.showHidden, settings.fontSizeOffset, selectedEntries,
    activeSelection.cursor, activeTab.root, newTab, closeTab, doNewFolder, doUndo,
    splitPane, doCopy, doCut, doPaste, doDelete, transferToSibling, toggleSearch,
    patchLeaf, navigate, activatePane, focusFilter, onSettingsChange, onOpenSettings, fsApi,
    terminalApi, toggleTerminal, assistant,
  ]);

  /* ---------------------------------------------------------------- *
   * Context menu
   * ---------------------------------------------------------------- */

  const openContextMenu = useCallback(
    (e: React.MouseEvent, entry: FsEntry | null, paneId: string) => {
      e.preventDefault();
      e.stopPropagation();
      activatePane(paneId);

      const selected = entry ? (selections[paneId]?.paths ?? [entry.path]) : [];
      const many = selected.length > 1;
      const leaf = findLeaf(activeTab.root, paneId);
      const dir = leaf?.path ?? activeLeaf.path;

      const items: MenuItem[] = entry
        ? [
            { label: 'Open', accel: 'Enter', onClick: () => (entry.kind === 'dir' ? navigate(paneId, entry.path) : void openEntry(entry)) },
            { label: 'Open in new tab', onClick: () => newTab(entry.kind === 'dir' ? entry.path : dir) },
            { separator: true, label: '' },
            { label: 'Cut', accel: 'Ctrl+X', onClick: doCut },
            { label: 'Copy', accel: 'Ctrl+C', onClick: doCopy },
            { label: 'Paste', accel: 'Ctrl+V', onClick: () => void doPaste() },
            { separator: true, label: '' },
            { label: many ? `Batch rename ${selected.length}` : 'Rename', accel: many ? 'Shift+F2' : 'F2', onClick: () => (many ? setBatchTargets(selectedEntries) : setRenaming(entry.path)) },
            ...(assistant
              ? [{ label: `Ask ${assistant.name} about this`, accel: 'Ctrl+Shift+A', onClick: () => setAskOpen(true) }]
              : []),
            { label: 'Copy path', onClick: () => fsApi.copyText(selected.join('\r\n')) },
            { label: 'Reveal in File Explorer', onClick: () => void fsApi.revealInExplorer(entry.path) },
            { separator: true, label: '' },
            { label: settings.deleteToTrash ? 'Move to Recycle Bin' : 'Delete', accel: 'Del', danger: true, onClick: () => void doDelete(false) },
            { label: 'Delete permanently', accel: 'Shift+Del', danger: true, onClick: () => void doDelete(true) },
          ]
        : [
            { label: 'New folder', accel: 'Ctrl+N', onClick: () => void doNewFolder() },
            { label: 'New file', onClick: () => void doNewFile() },
            { separator: true, label: '' },
            { label: 'Paste', accel: 'Ctrl+V', onClick: () => void doPaste() },
            { separator: true, label: '' },
            { label: 'Split pane right', accel: 'Ctrl+\\', onClick: () => splitPane('h') },
            { label: 'Split pane down', onClick: () => splitPane('v') },
            { separator: true, label: '' },
            { label: 'Open in Windows Terminal', onClick: () => void fsApi.openTerminalAt(dir) },
            { label: 'Reveal in File Explorer', onClick: () => void fsApi.revealInExplorer(dir) },
            { label: 'Pin this folder', onClick: pinCurrent },
          ];

      setCtxMenu({ x: e.clientX, y: e.clientY, items });
    },
    [activatePane, selections, activeTab.root, activeLeaf.path, navigate, openEntry, newTab, doCut, doCopy, doPaste, selectedEntries, fsApi, settings.deleteToTrash, doDelete, doNewFolder, doNewFile, splitPane, pinCurrent, assistant],
  );

  /* ---------------------------------------------------------------- *
   * Render
   * ---------------------------------------------------------------- */

  const renderLeaf = (leaf: PaneLeaf) => (
    <FilePane
      key={leaf.id}
      leaf={leaf}
      active={leaf.id === activeTab.activePaneId}
      multi={paneCount > 1}
      settings={settings}
      fsApi={fsApi}
      selection={selections[leaf.id] ?? { paths: [], cursor: null }}
      cutPaths={cutPaths}
      renaming={renaming}
      searchOpen={searchPanes.has(leaf.id)}
      onActivate={() => activatePane(leaf.id)}
      onNavigate={(path) => navigate(leaf.id, path)}
      onBack={() => patchLeaf(leaf.id, goBack)}
      onForward={() => patchLeaf(leaf.id, goForward)}
      onUp={() => void fsApi.parentOf(leaf.path).then((p) => p && navigate(leaf.id, p))}
      onSort={(key: SortKey) =>
        patchLeaf(leaf.id, (l) => ({
          ...l,
          sortKey: key,
          // Clicking the active column flips direction; a new column starts ascending.
          sortDir: l.sortKey === key ? (l.sortDir === 'asc' ? 'desc' : 'asc') : 'asc',
        }))
      }
      onToggleView={() =>
        patchLeaf(leaf.id, (l) => ({ ...l, viewMode: l.viewMode === 'grid' ? 'details' : 'grid' }))
      }
      onFilterChange={(text) => patchLeaf(leaf.id, (l) => ({ ...l, filter: text }))}
      onSelectionChange={(paths, cursor) => handleSelection(leaf.id, paths, cursor)}
      onListing={handleListing}
      onOpenFile={(entry) => void openEntry(entry)}
      onContextMenu={(e, entry) => openContextMenu(e, entry, leaf.id)}
      onDropPaths={(paths, destDir, copy) => void dropPaths(paths, destDir, copy)}
      onRenameCommit={(path, name) => void doRenameCommit(path, name)}
      onRenameCancel={() => setRenaming(null)}
      onCloseSearch={() => toggleSearch(leaf.id)}
      refreshKey={refreshKeys[leaf.id] ?? 0}
      onRefresh={() => setRefreshKeys((k) => ({ ...k, [leaf.id]: (k[leaf.id] ?? 0) + 1 }))}
    />
  );

  const totalSize = activeData.entries.reduce((sum, e) => sum + e.size, 0);
  const selectedSize = selectedEntries.reduce((sum, e) => sum + e.size, 0);

  return (
    <div className="body">
      {settings.sidebarVisible && (
        <Sidebar
          pinned={settings.pinned}
          known={known}
          drives={drives}
          currentPath={activeLeaf.path}
          onNavigate={(path) => navigate(activeLeaf.id, path)}
          onPin={pinCurrent}
          onUnpin={unpin}
          onDropPaths={(paths, destDir, copy) => void dropPaths(paths, destDir, copy)}
        />
      )}

      <div className="main">
        <TabStrip
          tabs={session.tabs}
          activeTabId={activeTab.id}
          onSelect={(id) => setSession((s) => ({ ...s, activeTabId: id }))}
          onClose={closeTab}
          onNew={() => newTab()}
        />

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0 }}>
            <PaneTreeView
              node={activeTab.root}
              renderLeaf={renderLeaf}
              onRatioChange={(splitId, ratio) =>
                mutateTab(activeTab.id, (tab) => ({ ...tab, root: setRatio(tab.root, splitId, ratio) }))
              }
            />
          </div>

          {settings.previewVisible && (
            <PreviewPane
              fsApi={fsApi}
              path={activeSelection.cursor}
              multiCount={activeSelection.paths.length}
            />
          )}
        </div>

        {terminalApi && settings.terminalVisible && (
          <TerminalDock
            // Keyed by tab: one shell per tab, which follows whichever pane is
            // active. Per-pane shells would mean four of them in a quad split.
            key={activeTab.id}
            id={activeTab.id}
            cwd={activeLeaf.path}
            theme={theme}
            fontSize={Math.max(9, theme.font.size + settings.fontSizeOffset)}
            height={settings.terminalHeight}
            shell={settings.shell}
            terminalApi={terminalApi}
            onShellCwd={handleShellCwd}
            onHeightChange={(h) => onSettingsChange({ terminalHeight: h })}
            onClose={toggleTerminal}
            copyText={fsApi.copyText}
            openLink={(url) => window.open(url, '_blank')}
            getPathForFile={fsApi.getPathForFile}
          />
        )}

        <div className="statusbar">
          <span>
            {activeData.entries.length} item{activeData.entries.length === 1 ? '' : 's'}
          </span>
          {selectedEntries.length > 0 && (
            <span className="statusbar__accent">
              {selectedEntries.length} selected · {formatBytes(selectedSize)}
            </span>
          )}
          {selectedEntries.length === 0 && totalSize > 0 && <span>{formatBytes(totalSize)}</span>}
          <span className="statusbar__spacer" />
          {toast && (
            <span className={toast.error ? 'statusbar__error' : 'statusbar__toast'}>{toast.text}</span>
          )}
          {progress && (
            <span>
              {progress.kind} {progress.fraction >= 0 ? `${Math.round(progress.fraction * 100)}%` : ''}
            </span>
          )}
          {undoText && (
            <button type="button" onClick={() => void doUndo()} title="Ctrl+Z">
              Undo: {undoText}
            </button>
          )}
          {progress && progress.fraction >= 0 && (
            <div className="progressline" style={{ width: `${progress.fraction * 100}%` }} />
          )}
        </div>
      </div>

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />
      )}

      {palette === 'paths' && (
        <CommandPalette
          placeholder="Go to folder — type a name or paste a path"
          items={pathItems}
          resolveExtra={resolveTypedPath}
          onClose={() => setPalette(null)}
        />
      )}
      {palette === 'actions' && (
        <CommandPalette
          placeholder="Run a command"
          items={commands}
          onClose={() => setPalette(null)}
        />
      )}

      {peekPath && <Peek fsApi={fsApi} path={peekPath} onClose={() => setPeekPath(null)} />}

      {askOpen && assistant && (
        <AskV
          assistant={assistant}
          context={{
            cwd: activeLeaf.path,
            selection: selectedEntries,
            visible: activeData.entries,
          }}
          onClose={() => setAskOpen(false)}
        />
      )}

      {batchTargets && batchTargets.length > 0 && (
        <BatchRename
          entries={batchTargets}
          onClose={() => setBatchTargets(null)}
          onApply={(pairs) => {
            setBatchTargets(null);
            void fsApi.renameMany(pairs).then((r) => report(r, `Renamed ${pairs.length} item(s)`));
          }}
        />
      )}

      {dialogNode}
    </div>
  );
}

/**
 * Rebuild last session's tabs, defensively: a settings file written by an older
 * build (or hand-edited) must not be able to crash the app on launch.
 */
function restoreSession(settings: Settings, initialPath: string): SessionState {
  const saved = settings.session;
  const valid =
    saved &&
    Array.isArray(saved.tabs) &&
    saved.tabs.length > 0 &&
    saved.tabs.every((t) => t?.root && typeof t.id === 'string') &&
    saved.tabs.some((t) => t.id === saved.activeTabId);
  if (valid) return saved;
  const leaf = makeLeaf(initialPath);
  const tab: TabState = { id: newId('t'), root: leaf, activePaneId: leaf.id };
  return { tabs: [tab], activeTabId: tab.id };
}
