import type { FsEntry } from '../../shared/types';

/**
 * The query filter bar (handoff §2.4).
 *
 *   report              name contains "report"
 *   ext:png             extension is png
 *   ext:png,jpg,webp    extension is any of these
 *   size:>10mb          larger than 10 MB   (also < <= >= =)
 *   mod:today           modified today      (yesterday | week | month | year)
 *   mod:>2026-01-01     modified after a date
 *   type:dir            folders only        (dir | file | link)
 *   name:"my report"    quoted phrase
 *   -draft              NOT: excludes names containing "draft"
 *
 * Terms are ANDed. Anything unparseable degrades to a plain name match rather
 * than erroring — a filter bar that punishes typing is a filter bar nobody uses.
 */

type Predicate = (e: FsEntry) => boolean;

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  k: 1024,
  kb: 1024,
  m: 1024 ** 2,
  mb: 1024 ** 2,
  g: 1024 ** 3,
  gb: 1024 ** 3,
  t: 1024 ** 4,
  tb: 1024 ** 4,
};

/** Split on whitespace but keep "quoted phrases" together. */
function tokenize(query: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    out.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return out.filter(Boolean);
}

function parseSize(value: string): Predicate | null {
  const m = /^(>=|<=|>|<|=)?\s*([\d.]+)\s*([a-z]*)$/i.exec(value.trim());
  if (!m) return null;
  const op = m[1] ?? '=';
  const n = Number(m[2]);
  if (!Number.isFinite(n)) return null;
  const unit = SIZE_UNITS[(m[3] || 'b').toLowerCase()];
  if (!unit) return null;
  const threshold = n * unit;
  switch (op) {
    case '>':
      return (e) => e.size > threshold;
    case '>=':
      return (e) => e.size >= threshold;
    case '<':
      return (e) => e.size < threshold;
    case '<=':
      return (e) => e.size <= threshold;
    default:
      // An exact byte count is rarely what anyone means; treat "=" as "about",
      // within 1% or 1 KB, whichever is larger.
      return (e) => Math.abs(e.size - threshold) <= Math.max(1024, threshold * 0.01);
  }
}

function startOfDay(offsetDays = 0): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d.getTime();
}

function parseModified(value: string): Predicate | null {
  const v = value.trim().toLowerCase();
  switch (v) {
    case 'today':
      return (e) => e.modified >= startOfDay(0);
    case 'yesterday':
      return (e) => e.modified >= startOfDay(1) && e.modified < startOfDay(0);
    case 'week':
      return (e) => e.modified >= startOfDay(7);
    case 'month':
      return (e) => e.modified >= startOfDay(30);
    case 'year':
      return (e) => e.modified >= startOfDay(365);
    default:
      break;
  }
  const m = /^(>=|<=|>|<)?\s*(\d{4}-\d{2}-\d{2})$/.exec(v);
  if (!m) return null;
  const t = Date.parse(m[2]);
  if (Number.isNaN(t)) return null;
  switch (m[1]) {
    case '<':
    case '<=':
      return (e) => e.modified <= t + 86_400_000;
    default:
      return (e) => e.modified >= t;
  }
}

function parseType(value: string): Predicate | null {
  switch (value.trim().toLowerCase()) {
    case 'dir':
    case 'folder':
      return (e) => e.kind === 'dir' || e.kind === 'junction';
    case 'file':
      return (e) => e.kind === 'file';
    case 'link':
    case 'symlink':
      return (e) => e.kind === 'symlink' || e.kind === 'junction';
    default:
      return null;
  }
}

function nameContains(needle: string): Predicate {
  const lower = needle.toLowerCase();
  return (e) => e.name.toLowerCase().includes(lower);
}

function parseTerm(token: string): Predicate {
  let negated = false;
  let t = token;
  if (t.startsWith('-') && t.length > 1) {
    negated = true;
    t = t.slice(1);
  }

  const colon = t.indexOf(':');
  let predicate: Predicate | null = null;

  if (colon > 0) {
    const key = t.slice(0, colon).toLowerCase();
    const value = t.slice(colon + 1);
    switch (key) {
      case 'ext': {
        const wanted = new Set(
          value
            .toLowerCase()
            .split(',')
            .map((s) => s.replace(/^\./, '').trim())
            .filter(Boolean),
        );
        predicate = wanted.size ? (e) => wanted.has(e.ext) : null;
        break;
      }
      case 'size':
        predicate = parseSize(value);
        break;
      case 'mod':
      case 'modified':
        predicate = parseModified(value);
        break;
      case 'type':
        predicate = parseType(value);
        break;
      case 'name':
        predicate = nameContains(value);
        break;
      default:
        predicate = null;
    }
  }

  // Unrecognized key, or no key at all: fall back to matching the whole token
  // against the name, so "ext:" mid-typing still behaves sensibly.
  if (!predicate) predicate = nameContains(t);

  return negated ? (e) => !predicate(e) : predicate;
}

export function parseFilter(query: string): Predicate | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;
  const terms = tokens.map(parseTerm);
  return (e) => terms.every((fn) => fn(e));
}

/** True when the query uses at least one structured term (for UI hinting). */
export function isStructuredQuery(query: string): boolean {
  return /(^|\s)-?(ext|size|mod|modified|type|name):/i.test(query);
}
