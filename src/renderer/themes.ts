import type { Theme } from '../shared/types';

// JetBrains Mono leads (V's Command Center font) with graceful fallbacks —
// Cascadia Code ships with modern Windows. We avoid a remote Google-Fonts
// @import because Onyx's production CSP blocks it; JetBrains Mono is used if
// installed locally, otherwise the stack degrades cleanly.
const MONO =
  '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, ui-monospace, monospace';

/** HSL (h in deg, s/l in 0–100) → #rrggbb. CSS Color 4 reference conversion. */
function hslHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    const color = lN - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color);
  };
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * The vlime family, ported from V's Command Center by way of Conduit. Every
 * palette is derived from a few accent knobs (hue / saturation / lightness +
 * glow): the structure (near-black green-tinted background, warm light
 * foreground) stays constant and only the accent — borders, focus, selection,
 * scrollbar, glow, active tab, drive bars — shifts. Add a palette by adding one
 * line below.
 */
interface VlimeKnobs {
  h: number;
  s: number;
  l: number;
  /** HUD glow intensity (Hub's --hub-glow-strength). */
  glow?: number;
  /** Optional background-lightness override (noir goes darker). */
  bgL?: number;
}

// Background hue/saturation shared across the family: near-black with a whisper
// of green (matches the Hub's `--background: 150 9% 3.5%`).
const BG_H = 150;
const BG_S = 9;

/**
 * Git badge colors, shared across every palette. These are semantic, not
 * decorative — recoloring "modified" per theme would make the badge unreadable.
 * Taken from Conduit's ANSI set so they sit naturally on the same background.
 */
const GIT = {
  gitModified: '#d4e157',
  gitAdded: '#a3e635',
  gitUntracked: '#4fc3f7',
  gitDeleted: '#ff5c7a',
} as const;

/** Build a Hub-faithful (light text, accent everything-else) vlime theme. */
function makeVlime(name: string, { h, s, l, glow = 1, bgL = 3.5 }: VlimeKnobs): Theme {
  const accent = hslHex(h, s, l);
  return {
    name,
    glowStrength: glow,
    font: { family: MONO, size: 13 },
    chrome: {
      chromeBg: hslHex(BG_H, BG_S, bgL),
      panelBg: hslHex(BG_H, BG_S, bgL + 2.5),
      rowBg: hslHex(BG_H, BG_S, bgL + 1.4),
      fg: hslHex(90, 6, 90), // warm light gray (Hub foreground), shared
      dimFg: hslHex(120, 5, 52),
      accent,
      // Accent-derived chrome — saturation clamped so low-sat palettes (Mono)
      // stay muted instead of forcing a green tint.
      border: hslHex(h, Math.min(s, 45), 22),
      selectionBg: hslHex(h, Math.min(s, 42), 18),
      scrollbar: hslHex(h, Math.min(s, 32), 30),
      ...GIT,
    },
  };
}

/**
 * Preset themes — the 13-palette vlime family (V's Command Center look), in the
 * same order as the Hub's settings grid. "Lime" is the flagship default.
 * A theme is just data.
 */
export const PRESETS: Theme[] = [
  makeVlime('Lime', { h: 104, s: 86, l: 60, glow: 1 }),
  makeVlime('Bright', { h: 90, s: 95, l: 60, glow: 1.5 }),
  makeVlime('Emerald', { h: 152, s: 80, l: 47, glow: 1.1 }),
  makeVlime('Cyan', { h: 184, s: 85, l: 50, glow: 1.15 }),
  makeVlime('Ice', { h: 202, s: 90, l: 62, glow: 1.15 }),
  makeVlime('Violet', { h: 266, s: 82, l: 68, glow: 1.25 }),
  makeVlime('Synthwave', { h: 318, s: 88, l: 64, glow: 1.35 }),
  makeVlime('Magenta', { h: 330, s: 90, l: 60, glow: 1.3 }),
  makeVlime('Crimson', { h: 352, s: 82, l: 57, glow: 1.2 }),
  makeVlime('Amber', { h: 38, s: 95, l: 55, glow: 1.1 }),
  makeVlime('Gold', { h: 46, s: 90, l: 58, glow: 1.0 }),
  makeVlime('Mono', { h: 150, s: 5, l: 82, glow: 0.5 }),
  makeVlime('Noir', { h: 104, s: 55, l: 50, glow: 0.4, bgL: 2.5 }),
];

export function findTheme(name: string, custom: Theme[]): Theme {
  return custom.find((t) => t.name === name) ?? PRESETS.find((t) => t.name === name) ?? PRESETS[0];
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Apply a theme by writing CSS custom properties on :root. Switching themes is
 * therefore a handful of variable writes and one repaint — no React re-render of
 * the tree, no flash, no relayout (handoff §10, last item).
 *
 * `root` is a parameter so the embeddable <Explorer/> can scope itself to its own
 * container inside V's Hub instead of stamping the whole Hub document.
 */
export function applyTheme(
  theme: Theme,
  fontSizeOffset = 0,
  root: HTMLElement = document.documentElement,
): void {
  for (const [key, value] of Object.entries(theme.chrome)) {
    root.style.setProperty(`--${kebab(key)}`, value);
  }
  root.style.setProperty('--hub-glow-strength', String(theme.glowStrength ?? 1));
  root.style.setProperty('--font-mono', theme.font.family);
  root.style.setProperty('--font-size', `${Math.max(9, theme.font.size + fontSizeOffset)}px`);
}
