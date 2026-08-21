import Store from 'electron-store';
import { DEFAULT_SETTINGS, type Settings } from '../shared/types';

// Typed JSON settings in the user-data dir (same approach as Conduit).
// The file is named onyx-settings.json so a stray copy in the repo is caught by
// .gitignore rather than committed with the user's pinned paths in it.
const store = new Store<{ settings: Settings }>({
  name: 'onyx-settings',
  defaults: { settings: DEFAULT_SETTINGS },
});

export function loadSettings(): Settings {
  // Spread over the defaults so a settings file written by an older version
  // gains new keys instead of leaving them undefined.
  return { ...DEFAULT_SETTINGS, ...store.get('settings') };
}

export function saveSettings(s: Settings): void {
  store.set('settings', s);
}
