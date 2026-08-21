import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Settings, UpdateStatus } from '../shared/types';
import { Explorer } from './Explorer';
import { createBridgeFsApi, createBridgeTerminalApi } from './fs-api';
import { createBrainAssistantApi } from './assistant';
import { SettingsPanel } from './components/SettingsPanel';
import { Icon } from './components/ui';
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

  // The updater runs itself on a schedule; this just mirrors what it's doing.
  // Nothing is shown for 'idle'/'checking'/'uptodate' — a file manager should
  // not narrate its own background chores.
  useEffect(() => {
    const stop = window.onyx.onUpdateStatus(setUpdate);
    void window.onyx.checkForUpdate().then(setUpdate);
    return stop;
  }, []);

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
          {update?.phase === 'downloading' && <span className="updatepill">Updating…</span>}
          {update?.phase === 'ready' && (
            <button
              type="button"
              className="updatepill updatepill--ready"
              title={`Version ${update.version ?? 'new'} is staged. Click to restart into it now; otherwise it applies on the next launch.`}
              onClick={() => window.onyx.restartToUpdate()}>
              Update ready — restart
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
      />

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={changeSettings}
          version={version}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
