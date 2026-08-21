import { HOME_PATH, type EntryKind, type FsEntry } from '../../shared/types';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** 1536 -> "1.5 KB". Binary units, because that is what Windows reports. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes === 0) return '0 B';
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  // Whole bytes never need a decimal; everything else gets one significant
  // fraction digit under 10 so columns stay narrow and scannable.
  const digits = i === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${UNITS[i]}`;
}

const TIME_FMT = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today shows a clock, anything older shows a date — the useful distinction. */
export function formatDate(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay ? TIME_FMT.format(d) : DATE_FMT.format(d);
}

export function formatFullDate(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString();
}

const KIND_LABEL: Record<EntryKind, string> = {
  dir: 'Folder',
  file: 'File',
  symlink: 'Shortcut',
  junction: 'Junction',
  unknown: '',
};

export function formatKind(entry: FsEntry): string {
  if (entry.kind !== 'file') return KIND_LABEL[entry.kind];
  return entry.ext ? `${entry.ext.toUpperCase()} file` : 'File';
}

/** "C:\Users\me\Documents" -> ["C:\", "Users", "me", "Documents"] with paths. */
export function breadcrumbSegments(p: string): { label: string; path: string }[] {
  if (!p) return [];
  if (p === HOME_PATH) return [{ label: 'Home', path: HOME_PATH }];
  const uncMatch = /^(\\\\[^\\]+\\[^\\]+)(\\.*)?$/.exec(p);
  let root: string;
  let rest: string;
  if (uncMatch) {
    root = uncMatch[1];
    rest = (uncMatch[2] ?? '').replace(/^\\/, '');
  } else {
    root = p.slice(0, 3); // "C:\"
    rest = p.slice(3);
  }
  const out = [{ label: root.replace(/\\$/, '') || root, path: root }];
  if (!rest) return out;
  let acc = root.endsWith('\\') ? root.slice(0, -1) : root;
  for (const part of rest.split('\\').filter(Boolean)) {
    acc = `${acc}\\${part}`;
    out.push({ label: part, path: acc });
  }
  return out;
}

export function basename(p: string): string {
  if (p === HOME_PATH) return 'Home';
  const cleaned = p.replace(/\\+$/, '');
  const i = cleaned.lastIndexOf('\\');
  return i === -1 ? cleaned : cleaned.slice(i + 1) || cleaned;
}
