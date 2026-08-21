import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Settings, UpdateStatus } from '../shared/types';
import { Explorer } from './Explorer';
import { createBridgeFsApi, createBridgeTerminalApi } from './fs-api';
import { createBrainAssistantApi } from './assistant';
import { SettingsPanel } from './components/SettingsPanel';
import { Icon } from './components/ui';
import type { PaletteItem } from './components/CommandPalette';
import { applyTheme, findTheme } from './themes';

/**
 * The standalone app's chrome: frameless title bar, window controls, settings,
 * and theme application. Everything below the title bar is <Explorer/>, which
 * knows nothing about Electron — that separation is what lets the same explorer
 * drop into V's Command Hub as a panel (see fs-api.ts).
 */
export function App(): React.JSX.Element {
  const fsApi = useMemo(() => createBridgeFsApi(), []);
  const terminalApi = useMemo(() => createBridgeTerminalApi(), []);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [home, setHome] = useState<string | null>(null);
  const [version, setVersion] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePath, setActivePath] = useState('');
  const [update, setUpdate] = useState<UpdateStatus | null>(null);
  const [updateToast, setUpdateToast] = useState<string | null>(null);
  /**
   * True while a check the USER asked for is in flight. Background activity
   * stays silent — a staged update just lights the title-bar pill and applies
   * next launch — but an explicit check narrates every phase, because someone
   * who just asked "am I up to date?" deserves an answer either way.
   */
  const explicitUpdate = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ---- boot ---- */

  useEffect(() => {
    void Promise.all([
      window.onyx.loadSettings(),
      window.onyx.homeDir(),
      window.onyx.getAppVersion(),
    ]).then(([loaded, homeDir, appVersion]) => {
      setSettings(loaded);
      setHome(homeDir);
      setVersion(appVersion);
    });
  }, []);

  useEffect(() => window.onyx.onWindowState(setMaximized), []);

  const showUpdateToast = useCallback((message: string, autoHideMs?: number) => {
    clearTimeout(toastTimer.current);
    setUpdateToast(message);
    if (autoHideMs) toastTimer.current = setTimeout(() => setUpdateToast(null), autoHideMs);
  }, []);

  // Main's updater streams its state here. Background phases are silent; an
  // explicit check is narrated, and restarts into the new version as soon as it
  // has downloaded rather than making the user click a second time.
  useEffect(() => {
    const stop = window.onyx.onUpdateStatus((s) => {
      setUpdate(s);
      const explicit = explicitUpdate.current;
      if (s.phase === 'ready') {
        if (explicit) {
          explicitUpdate.current = false;
          showUpdateToast(`Update downloaded${s.version ? ` (v${s.version})` : ''} — restarting…`);
          setTimeout(() => window.onyx.restartToUpdate(), 1200);
        }
        return; // a background 'ready' is announced by the title-bar pill alone
      }
      if (!explicit) return;
      if (s.phase === 'checking') showUpdateToast('Checking for updates…');
      else if (s.phase === 'downloading') showUpdateToast('Update found — downloading…');
      else if (s.phase === 'uptodate') {
        explicitUpdate.current = false;
        showUpdateToast("You're on the latest version.", 6000);
      } else if (s.phase === 'error') {
        explicitUpdate.current = false;
        showUpdateToast(`Update check failed: ${s.message ?? 'unknown error'}`, 8000);
      }
    });
    // Seed the current state on load. In a packaged app this doubles as a
    // check-on-open, alongside the updater's own 10-minute timer.
    void window.onyx.checkForUpdate().then(setUpdate);
    return stop;
  }, [showUpdateToast]);

  /** The user asked. Narrate it, and restart into the update once it lands. */
  const checkForUpdate = useCallback(() => {
    if (update?.phase === 'ready') {
      showUpdateToast('Update already downloaded — restarting…');
      setTimeout(() => window.onyx.restartToUpdate(), 800);
      return;
    }
    explicitUpdate.current = true;
    showUpdateToast('Checking for updates…');
    void window.onyx.checkForUpdate().then((s) => {
      setUpdate(s);
      if (s.phase === 'unsupported') {
        explicitUpdate.current = false;
        showUpdateToast('Dev build — the updater only runs in the installed app.', 6000);
      } else if (s.phase === 'downloading') {
        // A background download was already in flight; narrate it from here.
        showUpdateToast('Update found — downloading…');
      }
    });
  }, [update?.phase, showUpdateToast]);

  const hostCommands = useMemo<PaletteItem[]>(
    () => [
      {
        id: 'host-update',
        label: 'Check for updates',
        hint: update?.version ? `v${update.version} ready` : '',
        run: checkForUpdate,
      },
    ],
    [checkForUpdate, update?.version],
  );

  /**
   * "Ask V" is only offered when a brain URL is configured — clearing it in
   * settings removes the feature rather than leaving a button that always fails.
   */
  const assistant = useMemo(
    () =>
      settings?.assistantUrl
        ? createBrainAssistantApi(settings.assistantUrl, settings.assistantToken ?? '')
        : undefined,
    [settings?.assistantUrl, settings?.assistantToken],
  );

  /* ---- theme ---- */

  const theme = useMemo(
    () => (settings ? findTheme(settings.activeTheme, settings.customThemes) : null),
    [settings],
  );

  useEffect(() => {
    if (theme && settings) applyTheme(theme, settings.fontSizeOffset);
  }, [theme, settings]);

  useEffect(() => {
    if (settings) window.onyx.setOpacity(settings.windowOpacity);
  }, [settings]);

  /* ---- settings persistence ---- */

  // Writing on every keystroke of a slider would hammer the disk; the debounce
  // keeps the file in sync without making the UI wait for it.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void window.onyx.saveSettings(next), 350);
      return next;
    });
  }, []);

  // A pending save must still land if the window is closing.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setSettings((cur) => {
        if (cur) void window.onyx.saveSettings(cur);
        return cur;
      });
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  // `theme` is derived from `settings`, so it is non-null whenever settings is —
  // but narrowing it here is what lets <Explorer/> take a plain `Theme` instead
  // of a nullable one.
  if (!settings || !home || !theme) {
    return <div className="loading">Onyx</div>;
  }

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar__brand">
          <span className="titlebar__mark" />
          <span>Onyx</span>
        </div>
        <div className="titlebar__spacer" />
        <div className="titlebar__status" title={activePath}>
          {updateToast && <span className="updatetoast">{updateToast}</span>}
          {!updateToast && update?.phase === 'downloading' && (
            <span className="updatepill">Downloading update…</span>
          )}
          {update?.phase === 'ready' && (
            <button
              type="button"
              className="updatepill updatepill--ready"
              title={`${update.version ? `v${update.version}` : 'A new version'} is staged. Click to restart into it now; otherwise it applies on the next launch.`}
              onClick={() => window.onyx.restartToUpdate()}>
              ⟳ {update.version ? `v${update.version} ready` : 'update ready'} — restart
            </button>
          )}
          <span>{activePath}</span>
        </div>
        <div className="titlebar__controls">
          <button
            type="button"
            className="wc"
            title="Settings (Ctrl+,)"
            onClick={() => setSettingsOpen(true)}>
            <Icon name="settings" />
          </button>
          <button
            type="button"
            className="wc"
            title="Minimize"
            onClick={() => window.onyx.windowControl('minimize')}>
            <Icon name="minimize" />
          </button>
          <button
            type="button"
            className="wc"
            title={maximized ? 'Restore' : 'Maximize'}
            onClick={() => window.onyx.windowControl('maximize')}>
            <Icon name={maximized ? 'restore' : 'maximize'} />
          </button>
          <button
            type="button"
            className="wc wc--close"
            title="Close"
            onClick={() => window.onyx.windowControl('close')}>
            <Icon name="close" />
          </button>
        </div>
      </div>

      <Explorer
        fsApi={fsApi}
        terminalApi={terminalApi}
        assistant={assistant}
        theme={theme}
        settings={settings}
        onSettingsChange={changeSettings}
        initialPath={home}
        onOpenSettings={() => setSettingsOpen(true)}
        onActivePathChange={setActivePath}
        commands={hostCommands}
      />

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={changeSettings}
          version={version}
          update={update}
          onCheckForUpdate={checkForUpdate}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
