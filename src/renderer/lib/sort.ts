import type { FsEntry, SortDir, SortKey } from '../../shared/types';

/**
 * Natural ("Explorer") ordering: file10 sorts after file9, not before it.
 * Intl.Collator with numeric:true is both correct and fast enough to run over
 * tens of thousands of rows.
 */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function sortEntries(
  entries: FsEntry[],
  key: SortKey,
  dir: SortDir,
  foldersFirst: boolean,
): FsEntry[] {
  const sign = dir === 'asc' ? 1 : -1;
  const isFolder = (e: FsEntry) => e.kind === 'dir' || e.kind === 'junction';

  // Copy first: the caller's array is React state and must not be mutated.
  return [...entries].sort((a, b) => {
    if (foldersFirst) {
      const fa = isFolder(a) ? 0 : 1;
      const fb = isFolder(b) ? 0 : 1;
      // Folders-first is absolute — it is not inverted by a descending sort,
      // which is what every file manager does and what users expect.
      if (fa !== fb) return fa - fb;
    }

    let cmp = 0;
    switch (key) {
      case 'size':
        cmp = a.size - b.size;
        break;
      case 'modified':
        cmp = a.modified - b.modified;
        break;
      case 'ext':
        cmp = collator.compare(a.ext, b.ext);
        break;
      case 'kind':
        cmp = collator.compare(a.kind, b.kind);
        break;
      default:
        cmp = 0;
    }
    // Name is the tiebreaker for every other column, so equal sizes or equal
    // timestamps still produce a stable, readable order.
    if (cmp === 0) cmp = collator.compare(a.name, b.name);
    return cmp * sign;
  });
}
