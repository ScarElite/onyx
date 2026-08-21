/**
 * Subsequence fuzzy matching for the command palette.
 *
 * Scores reward the things that make a match feel "right": consecutive runs,
 * matches at word boundaries (after a separator), and a match at the very start.
 * Returns null when the query is not a subsequence at all, so callers can filter
 * and rank in one pass.
 */
export interface FuzzyMatch {
  score: number;
  /** Indexes in `target` that matched, for highlighting. */
  positions: number[];
}

const SEPARATORS = new Set(['\\', '/', ' ', '-', '_', '.', ':']);

export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, positions: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  const positions: number[] = [];
  let score = 0;
  let ti = 0;
  let consecutive = 0;

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    // Spaces in a query mean "and then, somewhere later" — skip them.
    if (ch === ' ') {
      consecutive = 0;
      continue;
    }

    let found = -1;
    for (let i = ti; i < t.length; i++) {
      if (t[i] === ch) {
        found = i;
        break;
      }
    }
    if (found === -1) return null;

    // Bonuses, largest first: start of string > after a separator > consecutive.
    if (found === 0) score += 15;
    else if (SEPARATORS.has(t[found - 1])) score += 10;
    else if (target[found] >= 'A' && target[found] <= 'Z') score += 6; // camelCase
    if (found === ti && qi > 0) {
      consecutive += 1;
      score += 5 + consecutive * 2;
    } else {
      consecutive = 0;
    }
    // Gaps cost, but only mildly — a long path shouldn't lose to a short one
    // just for having directories in it.
    score -= Math.min(found - ti, 10) * 0.5;

    positions.push(found);
    ti = found + 1;
  }

  // Prefer shorter targets when scores are otherwise close.
  score -= t.length * 0.05;
  return { score, positions };
}

export function fuzzyRank<T>(
  query: string,
  items: T[],
  keyOf: (item: T) => string,
  limit = 50,
): { item: T; match: FuzzyMatch }[] {
  const out: { item: T; match: FuzzyMatch }[] = [];
  for (const item of items) {
    const match = fuzzyMatch(query, keyOf(item));
    if (match) out.push({ item, match });
  }
  out.sort((a, b) => b.match.score - a.match.score);
  return out.slice(0, limit);
}
