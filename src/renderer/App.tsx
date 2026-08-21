import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Settings } from '../shared/types';
import { Explorer } from './Explorer';
import { createBridgeFsApi } from './fs-api';
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
  const [settings, setSettings] = useState<Settings | null>(null);
  const [home, setHome] = useState<string | null>(null);
  const [version, setVersion] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePath, setActivePath] = useState('');

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

  if (!settings || !home) {
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
