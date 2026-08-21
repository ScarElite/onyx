import React, { useMemo, useState } from 'react';
import type { FsEntry } from '../../shared/types';
import { Modal } from './ui';

type CaseOp = 'none' | 'lower' | 'upper' | 'title';

// eslint-disable-next-line no-control-regex -- control chars really are illegal in Windows filenames
const ILLEGAL = /[<>:"/\\|?*\u0000-\u001f]/;

/**
 * Batch rename with a live before/after table (handoff §2.10). Nothing touches
 * disk until Apply, and the whole batch lands as ONE undoable operation.
 */
export function BatchRename({
  entries,
  onApply,
  onClose,
}: {
  entries: FsEntry[];
  onApply: (pairs: { path: string; newName: string }[]) => void;
  onClose: () => void;
}): React.JSX.Element {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [regex, setRegex] = useState(false);
  const [caseOp, setCaseOp] = useState<CaseOp>('none');
  const [numberFrom, setNumberFrom] = useState('');
  const [pad, setPad] = useState(2);

  const { rows, error, changedCount } = useMemo(() => {
    let re: RegExp | null = null;
    if (find && regex) {
      try {
        re = new RegExp(find, 'g');
      } catch (e) {
        return { rows: [], error: `Invalid pattern: ${(e as Error).message}`, changedCount: 0 };
      }
    }

    const start = numberFrom.trim() === '' ? null : Number(numberFrom);
    if (start !== null && !Number.isFinite(start)) {
      return { rows: [], error: 'Start number must be a number', changedCount: 0 };
    }

    const seen = new Map<string, number>();
    const built = entries.map((entry, i) => {
      const dot = entry.kind === 'file' ? entry.name.lastIndexOf('.') : -1;
      // Only the stem is transformed — silently rewriting extensions in a bulk
      // operation is how people lose files.
      let stem = dot > 0 ? entry.name.slice(0, dot) : entry.name;
      const ext = dot > 0 ? entry.name.slice(dot) : '';

      if (find) {
        stem = re ? stem.replace(re, replace) : stem.split(find).join(replace);
      }
      switch (caseOp) {
        case 'lower':
          stem = stem.toLowerCase();
          break;
        case 'upper':
          stem = stem.toUpperCase();
          break;
        case 'title':
          stem = stem.replace(/\b\w/g, (c) => c.toUpperCase());
          break;
        default:
          break;
      }
      if (start !== null) {
        stem = `${stem}${String(start + i).padStart(pad, '0')}`;
      }

      const newName = `${stem}${ext}`;
      const key = newName.toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
      return { entry, newName, key };
    });

    const rows = built.map((row) => ({
      ...row,
      // Windows filenames are case-insensitive, so "A.txt" and "a.txt" collide.
      duplicate: (seen.get(row.key) ?? 0) > 1,
      illegal: !row.newName.trim() || ILLEGAL.test(row.newName) || row.newName.endsWith('.'),
    }));

    const bad = rows.find((r) => r.duplicate || r.illegal);
    return {
      rows,
      error: bad
        ? bad.illegal
          ? `"${bad.newName}" is not a valid filename`
          : `"${bad.newName}" would collide with another renamed file`
        : null,
      changedCount: rows.filter((r) => r.newName !== r.entry.name).length,
    };
  }, [entries, find, replace, regex, caseOp, numberFrom, pad]);

  const apply = () => {
    if (error || changedCount === 0) return;
    onApply(
      rows
        .filter((r) => r.newName !== r.entry.name)
        .map((r) => ({ path: r.entry.path, newName: r.newName })),
    );
  };

  return (
    <Modal
      title={`Batch rename — ${entries.length} item${entries.length === 1 ? '' : 's'}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!!error || changedCount === 0}
            onClick={apply}>
            Rename {changedCount || ''}
          </button>
        </>
      }>
      <div className="rename__grid">
        <label htmlFor="br-find">Find</label>
        <input
          id="br-find"
          className="modal__input"
          value={find}
          spellCheck={false}
          placeholder={regex ? '(\\d+)' : 'text to replace'}
          onChange={(e) => setFind(e.target.value)}
        />

        <label htmlFor="br-replace">Replace</label>
        <input
          id="br-replace"
          className="modal__input"
          value={replace}
          spellCheck={false}
          placeholder={regex ? '$1' : 'replacement'}
          onChange={(e) => setReplace(e.target.value)}
        />

        <label htmlFor="br-case">Options</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`search__toggle${regex ? ' search__toggle--on' : ''}`}
            onClick={() => setRegex((v) => !v)}
            title="Treat Find as a regular expression ($1 in Replace inserts a group)">
            Regex
          </button>
          <select
            id="br-case"
            className="modal__input"
            style={{ width: 120 }}
            value={caseOp}
            onChange={(e) => setCaseOp(e.target.value as CaseOp)}>
            <option value="none">Keep case</option>
            <option value="lower">lowercase</option>
            <option value="upper">UPPERCASE</option>
            <option value="title">Title Case</option>
          </select>
          <input
            className="modal__input"
            style={{ width: 108 }}
            value={numberFrom}
            placeholder="number from"
            onChange={(e) => setNumberFrom(e.target.value)}
            title="Append a sequential number starting at this value"
          />
          <input
            className="modal__input"
            style={{ width: 64 }}
            type="number"
            min={1}
            max={8}
            value={pad}
            onChange={(e) => setPad(Number(e.target.value) || 1)}
            title="Digits to pad the number to"
          />
        </div>
      </div>

      <div className="rename__preview">
        {rows.map((row) => (
          <div className="rename__row" key={row.entry.path}>
            <span className="rename__from" title={row.entry.name}>
              {row.entry.name}
            </span>
            <span className="rename__arrow">→</span>
            <span
              className={[
                'rename__to',
                row.newName === row.entry.name ? 'rename__to--same' : '',
                row.duplicate || row.illegal ? 'rename__to--bad' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={row.newName}>
              {row.newName}
            </span>
          </div>
        ))}
      </div>

      <div className="modal__error">{error}</div>
    </Modal>
  );
}
