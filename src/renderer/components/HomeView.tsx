import React, { useEffect, useMemo, useState } from 'react';
import type { DriveInfo, FsEntry, Place, RecentItem } from '../../shared/types';
import type { FsApi } from '../fs-api';
import { formatBytes, basename } from '../lib/format';
import { useShellIcons } from '../lib/useShellIcons';
import { Icon } from './ui';

/** "3 minutes ago" — recency is the only thing worth knowing on this screen. */
function ago(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(ms).toLocaleDateString();
}

/**
 * `useShellIcons` takes FsEntry-shaped things because that is what a listing
 * produces. Home deals in bare paths, so adapt rather than duplicate the hook.
 */
function asEntries(paths: { path: string; isDir: boolean }[]): FsEntry[] {
  return paths.map((p) => ({
    name: basename(p.path),
    path: p.path,
    kind: p.isDir ? ('dir' as const) : ('file' as const),
    size: 0,
    modified: 0,
    created: 0,
    hidden: false,
    system: false,
    readonly: false,
    placeholder: false,
    inaccessible: false,
    ext: p.isDir ? '' : (p.path.split('.').pop() ?? '').toLowerCase(),
  }));
}

export interface HomeViewProps {
  fsApi: FsApi;
  pinned: Place[];
  known: Place[];
  drives: DriveInfo[];
  recentFiles: RecentItem[];
  onNavigate: (path: string) => void;
  onOpenFile: (path: string) => void;
  onRevealFile: (path: string) => void;
  onClearRecent: () => void;
}

/**
 * The Home tab — Explorer's landing screen, in Onyx's chrome: the places you
 * pinned, the folders Windows already knows about, your drives, and what you
 * opened recently. New tabs start here rather than duplicating the current
 * folder, which is what File Explorer does and what people expect.
 */
export function HomeView({
  fsApi,
  pinned,
  known,
  drives,
  recentFiles,
  onNavigate,
  onOpenFile,
  onRevealFile,
  onClearRecent,
}: HomeViewProps): React.JSX.Element {
  const [missing, setMissing] = useState<Set<string>>(new Set());

  // Quick access = what you pinned, then the known folders you haven't.
  const quick = useMemo(() => {
    const seen = new Set(pinned.map((p) => p.path.toLowerCase()));
    return [...pinned, ...known.filter((k) => !seen.has(k.path.toLowerCase()))];
  }, [pinned, known]);

  const quickEntries = useMemo(
    () => asEntries(quick.map((q) => ({ path: q.path, isDir: true }))),
    [quick],
  );
  const recentEntries = useMemo(
    () => asEntries(recentFiles.map((r) => ({ path: r.path, isDir: false }))),
    [recentFiles],
  );

  const quickIcons = useShellIcons(fsApi, quickEntries, 'large', 'home-quick');
  const recentIcons = useShellIcons(fsApi, recentEntries, 'normal', 'home-recent');

  // A recent file that has since been deleted or moved should say so rather
  // than silently failing when clicked.
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      recentFiles.slice(0, 40).map(async (r) => {
        const found = await fsApi.resolvePath(r.path, r.path);
        return found ? null : r.path;
      }),
    ).then((gone) => {
      if (!cancelled) setMissing(new Set(gone.filter((g): g is string => !!g)));
    });
    return () => {
      cancelled = true;
    };
  }, [fsApi, recentFiles]);

  return (
    <div className="home">
      <section className="home__section">
        <h2 className="home__heading">Quick access</h2>
        <div className="home__tiles">
          {quick.map((place) => (
            <button
              key={place.path}
              type="button"
              className="hometile"
              title={place.path}
              onDoubleClick={() => onNavigate(place.path)}
              onClick={() => onNavigate(place.path)}>
              <span className="hometile__art">
                {quickIcons[place.path] ? (
                  <img className="hometile__icon" src={quickIcons[place.path]} alt="" />
                ) : (
                  <Icon name="folder" size={30} />
                )}
              </span>
              <span className="hometile__name">{place.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="home__section">
        <h2 className="home__heading">Drives</h2>
        <div className="home__drives">
          {drives.map((drive) => {
            const used = drive.total > 0 ? drive.total - drive.free : 0;
            const pct = drive.total > 0 ? Math.round((used / drive.total) * 100) : 0;
            const fill = pct >= 92 ? ' drive__fill--crit' : pct >= 80 ? ' drive__fill--warn' : '';
            return (
              <button
                key={drive.path}
                type="button"
                className="homedrive"
                title={drive.path}
                onClick={() => onNavigate(drive.path)}>
                <div className="homedrive__top">
                  <Icon name="drive" />
                  <span className="homedrive__label">
                    {drive.label} ({drive.letter})
                  </span>
                </div>
                {drive.ready ? (
                  <>
                    <div className="drive__bar">
                      <div className={`drive__fill${fill}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="homedrive__meta">
                      {formatBytes(drive.free)} free of {formatBytes(drive.total)}
                    </div>
                  </>
                ) : (
                  <div className="homedrive__meta">Not ready</div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="home__section">
        <h2 className="home__heading">
          Recent
          {recentFiles.length > 0 && (
            <button type="button" className="home__clear" onClick={onClearRecent}>
              Clear
            </button>
          )}
        </h2>
        {recentFiles.length === 0 ? (
          <p className="home__empty">Files you open will show up here.</p>
        ) : (
          <div className="home__recent">
            {recentFiles.slice(0, 25).map((item) => {
              const gone = missing.has(item.path);
              return (
                <button
                  key={item.path + item.at}
                  type="button"
                  className={`homerecent${gone ? ' homerecent--gone' : ''}`}
                  title={gone ? `${item.path} (no longer there)` : item.path}
                  onDoubleClick={() => !gone && onRevealFile(item.path)}
                  onClick={() => !gone && onOpenFile(item.path)}>
                  <span className="homerecent__icon">
                    {recentIcons[item.path] ? (
                      <img className="row__shellicon" src={recentIcons[item.path]} alt="" />
                    ) : (
                      <Icon name="file" />
                    )}
                  </span>
                  <span className="homerecent__name">{item.name}</span>
                  <span className="homerecent__dir">
                    {gone ? 'no longer there' : item.path.slice(0, item.path.lastIndexOf('\\'))}
                  </span>
                  <span className="homerecent__when">{ago(item.at)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
