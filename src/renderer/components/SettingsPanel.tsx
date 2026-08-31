import React from 'react';
import type { Settings, Theme, UpdateStatus } from '../../shared/types';
import { PRESETS } from '../themes';
import { Modal } from './ui';

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): React.JSX.Element {
  return (
    <div className="setting">
      <div>
        <div className="setting__label">{label}</div>
        {hint && <span className="setting__hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        className={`toggle${value ? ' toggle--on' : ''}`}
        onClick={() => onChange(!value)}
      />
    </div>
  );
}

/** One line of plain English for each updater state. */
function updateLabel(update: UpdateStatus | null, lastChecked: number | null): string {
  const checked = lastChecked
    ? ` · checked ${new Date(lastChecked).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : '';
  switch (update?.phase) {
    case 'checking':
      return 'Checking…';
    case 'downloading':
      return `Downloading${update.version ? ` v${update.version}` : ''}…`;
    case 'ready':
      return `${update.version ? `v${update.version}` : 'An update'} downloaded — install it whenever you like`;
    case 'uptodate':
      return `Up to date${checked}`;
    case 'error':
      return `${update.message ?? 'Update check failed'}${checked}`;
    case 'unsupported':
      return 'Dev build — updates only run in the installed app';
    default:
      return 'Checks on launch and every 10 minutes';
  }
}

export function SettingsPanel({
  settings,
  onChange,
  version,
  update,
  lastChecked,
  onCheckForUpdate,
  onInstallUpdate,
  onClose,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  version: string;
  update: UpdateStatus | null;
  /** Epoch ms of the last completed check, for the "checked at" hint. */
  lastChecked: number | null;
  onCheckForUpdate: () => void;
  onInstallUpdate: () => void;
  onClose: () => void;
}): React.JSX.Element {
  const themes: Theme[] = [...PRESETS, ...settings.customThemes];
  // A check already in flight owns the updater singleton; a second one errors.
  const checking = update?.phase === 'checking' || update?.phase === 'downloading';
  const staged = update?.phase === 'ready';

  return (
    <Modal
      title="Settings"
      wide
      onClose={onClose}
      footer={
        <>
          <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dim-fg)' }}>
            Onyx {version}
          </span>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Done
          </button>
        </>
      }>
      <div className="settings__section">
        <h3>Palette</h3>
        <div className="palettegrid">
          {themes.map((theme) => (
            <button
              key={theme.name}
              type="button"
              className={`swatch${theme.name === settings.activeTheme ? ' swatch--active' : ''}`}
              onClick={() => onChange({ activeTheme: theme.name })}>
              <span
                className="swatch__chip"
                style={{ background: theme.chrome.accent, color: theme.chrome.accent }}
              />
              <span>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings__section">
        <h3>Listing</h3>
        <Toggle
          label="Show hidden items"
          hint="Dot-files and known Windows system items"
          value={settings.showHidden}
          onChange={(v) => onChange({ showHidden: v })}
        />
        <Toggle
          label="Show protected system items"
          hint="$Recycle.Bin, pagefile.sys, System Volume Information"
          value={settings.showSystem}
          onChange={(v) => onChange({ showSystem: v })}
        />
        <Toggle
          label="Folders first"
          hint="Keeps folders above files whichever column you sort by"
          value={settings.foldersFirst}
          onChange={(v) => onChange({ foldersFirst: v })}
        />
        <Toggle
          label="Real folder sizes"
          hint="Computes sizes in the background and draws a heat bar per row"
          value={settings.showFolderSizes}
          onChange={(v) => onChange({ showFolderSizes: v })}
        />
        <Toggle
          label="Git status"
          hint="Badges per row and the branch in the breadcrumb, inside repositories"
          value={settings.showGitStatus}
          onChange={(v) => onChange({ showGitStatus: v })}
        />
      </div>

      <div className="settings__section">
        <h3>Layout</h3>
        <Toggle
          label="Sidebar"
          value={settings.sidebarVisible}
          onChange={(v) => onChange({ sidebarVisible: v })}
        />
        <Toggle
          label="Preview pane"
          value={settings.previewVisible}
          onChange={(v) => onChange({ previewVisible: v })}
        />
        <div className="setting">
          <div>
            <div className="setting__label">Window opacity</div>
            <span className="setting__hint">{Math.round(settings.windowOpacity * 100)}%</span>
          </div>
          <input
            className="slider"
            type="range"
            min={0.4}
            max={1}
            step={0.01}
            value={settings.windowOpacity}
            onChange={(e) => onChange({ windowOpacity: Number(e.target.value) })}
          />
        </div>
        <div className="setting">
          <div>
            <div className="setting__label">Text size</div>
            <span className="setting__hint">
              {settings.fontSizeOffset >= 0 ? `+${settings.fontSizeOffset}` : settings.fontSizeOffset} · Ctrl +/− resets with Ctrl+0
            </span>
          </div>
          <input
            className="slider"
            type="range"
            min={-3}
            max={8}
            step={1}
            value={settings.fontSizeOffset}
            onChange={(e) => onChange({ fontSizeOffset: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="settings__section">
        <h3>Assistant</h3>
        <div className="setting">
          <div>
            <div className="setting__label">V&apos;s brain</div>
            <span className="setting__hint">
              WebSocket for &ldquo;Ask V&rdquo; (Ctrl+Shift+A). Clear it to hide the feature.
              Loopback addresses only.
            </span>
          </div>
          <input
            className="modal__input"
            style={{ width: 220 }}
            spellCheck={false}
            placeholder="ws://127.0.0.1:8765/ws"
            value={settings.assistantUrl}
            onChange={(e) => onChange({ assistantUrl: e.target.value })}
          />
        </div>
        <div className="setting">
          <div>
            <div className="setting__label">Device token</div>
            <span className="setting__hint">
              Only if the brain is configured to require BRAIN_DEVICE_TOKEN.
            </span>
          </div>
          <input
            className="modal__input"
            style={{ width: 220 }}
            type="password"
            spellCheck={false}
            value={settings.assistantToken ?? ''}
            onChange={(e) => onChange({ assistantToken: e.target.value })}
          />
        </div>
      </div>

      <div className="settings__section">
        <h3>Terminal</h3>
        <div className="setting">
          <div>
            <div className="setting__label">Shell</div>
            <span className="setting__hint">
              Blank auto-detects PowerShell 7, then Windows PowerShell.
            </span>
          </div>
          <input
            className="modal__input"
            style={{ width: 220 }}
            spellCheck={false}
            placeholder="auto-detect"
            value={settings.shell ?? ''}
            onChange={(e) => onChange({ shell: e.target.value })}
          />
        </div>
      </div>

      <div className="settings__section">
        <h3>Updates</h3>
        {/* Two separate buttons on purpose: looking is not installing. Onyx
            restarts to apply an update, and a file manager must never do that
            out from under a copy you are halfway through. */}
        <div className="setting">
          <div>
            <div className="setting__label">Onyx {version}</div>
            <span className="setting__hint">{updateLabel(update, lastChecked)}</span>
          </div>
          <div className="setting__actions">
            <button
              type="button"
              className="btn"
              onClick={onCheckForUpdate}
              disabled={checking || update?.phase === 'unsupported'}>
              {update?.phase === 'checking' ? 'Checking…' : 'Check for updates'}
            </button>
            <button
              type="button"
              className={`btn${staged ? ' btn--primary' : ''}`}
              onClick={onInstallUpdate}
              disabled={!staged}
              title={
                staged
                  ? 'Restart Onyx into the downloaded version now'
                  : 'Available once an update has been downloaded'
              }>
              {staged && update.version ? `Install v${update.version}` : 'Install update'}
            </button>
          </div>
        </div>
      </div>

      <div className="settings__section">
        <h3>Safety</h3>
        <Toggle
          label="Delete to the Recycle Bin"
          hint="Off means Delete removes permanently — undo cannot bring those back"
          value={settings.deleteToTrash}
          onChange={(v) => onChange({ deleteToTrash: v })}
        />
        <Toggle
          label="Confirm before deleting"
          value={settings.confirmDelete}
          onChange={(v) => onChange({ confirmDelete: v })}
        />
      </div>
    </Modal>
  );
}
