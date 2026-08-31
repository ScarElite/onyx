import React, { useState } from 'react';
import { HOME_PATH, type DriveInfo, type Place } from '../../shared/types';
import { readDropPaths, useSpringLoad } from '../lib/dnd';
import { formatBytes } from '../lib/format';
import { Icon } from './ui';

/**
 * The sidebar doubles as a system readout: pinned places, the known folders
 * Windows already gives you, and live drive rows with capacity bars. Drives are
 * the reason it's worth having — Explorer buries free space two clicks deep.
 */
export function Sidebar({
  pinned,
  known,
  drives,
  currentPath,
  onNavigate,
  onPin,
  onUnpin,
  onDropPaths,
}: {
  pinned: Place[];
  known: Place[];
  drives: DriveInfo[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onPin: () => void;
  onUnpin: (path: string) => void;
  onDropPaths: (paths: string[], destDir: string, copy: boolean) => void;
}): React.JSX.Element {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Holding a drag over a place walks the pane into it — the usual way into a
  // nested folder starts from somewhere in the sidebar, not from the folder
  // you happen to be standing in.
  const spring = useSpringLoad(onNavigate);

  const dropProps = (dest: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.ctrlKey ? ('copy' as const) : ('move' as const);
      setDropTarget(dest);
      spring.hover(dest);
    },
    onDragLeave: () => setDropTarget((t) => (t === dest ? null : t)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDropTarget(null);
      const paths = readDropPaths(e);
      if (paths.length) onDropPaths(paths, dest, e.ctrlKey);
    },
  });

  const isCurrent = (p: string) => p.toLowerCase() === currentPath.toLowerCase();

  const renderPlace = (place: Place, pinnable: boolean) => (
    <button
      key={place.path}
      type="button"
      className={[
        'place',
        isCurrent(place.path) ? 'place--active' : '',
        dropTarget === place.path ? 'place--drop' : '',
        spring.path === place.path ? 'is-springing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={place.path}
      onClick={() => onNavigate(place.path)}
      {...dropProps(place.path)}>
      <Icon name={pinnable ? 'star' : 'folder'} />
      <span className="place__name">{place.name}</span>
      {pinnable && (
        <span
          className="place__unpin"
          title="Unpin"
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(place.path);
          }}>
          ✕
        </span>
      )}
    </button>
  );

  return (
    <div className="sidebar">
      <button
        type="button"
        className={`place${isCurrent(HOME_PATH) ? ' place--active' : ''}`}
        style={{ marginTop: 10 }}
        title="Home — quick access, drives and recent files"
        onClick={() => onNavigate(HOME_PATH)}>
        <Icon name="star" />
        <span className="place__name">Home</span>
      </button>

      <div className="sidebar__section">
        <div className="sidebar__heading">
          <span>Pinned</span>
          <button
            type="button"
            className="sidebar__add"
            title="Pin the current folder"
            onClick={onPin}>
            +
          </button>
        </div>
        {pinned.length === 0 ? (
          <div className="place" style={{ opacity: 0.5, cursor: 'default' }}>
            <span className="place__name">Nothing pinned yet</span>
          </div>
        ) : (
          pinned.map((p) => renderPlace(p, true))
        )}
      </div>

      <div className="sidebar__section">
        <div className="sidebar__heading">
          <span>Quick access</span>
        </div>
        {known.map((p) => renderPlace(p, false))}
      </div>

      <div className="sidebar__section">
        <div className="sidebar__heading">
          <span>Drives</span>
        </div>
        {drives.map((drive) => {
          const used = drive.total > 0 ? drive.total - drive.free : 0;
          const pct = drive.total > 0 ? Math.round((used / drive.total) * 100) : 0;
          // A drive that is nearly full stops being decoration and becomes a
          // warning, so the bar changes color rather than just growing.
          const fillClass =
            pct >= 92 ? ' drive__fill--crit' : pct >= 80 ? ' drive__fill--warn' : '';
          return (
            <button
              key={drive.path}
              type="button"
              className={[
                'drive',
                isCurrent(drive.path) ? 'drive--active' : '',
                dropTarget === drive.path ? 'place--drop' : '',
                spring.path === drive.path ? 'is-springing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ display: 'block', width: '100%', textAlign: 'left' }}
              title={
                drive.ready
                  ? `${drive.label} (${drive.letter}) — ${formatBytes(drive.free)} free of ${formatBytes(drive.total)}`
                  : `${drive.letter} — not ready`
              }
              onClick={() => onNavigate(drive.path)}
              {...dropProps(drive.path)}>
              <div className="drive__top">
                <span className="drive__label">
                  {drive.label} ({drive.letter})
                </span>
                <span className="drive__pct">{drive.ready ? `${pct}%` : '—'}</span>
              </div>
              {drive.ready && (
                <>
                  <div className="drive__bar">
                    <div className={`drive__fill${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="drive__pct" style={{ marginTop: 3 }}>
                    {formatBytes(drive.free)} free
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
