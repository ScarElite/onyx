import React, { useEffect, useState } from 'react';
import type { PreviewPayload } from '../../shared/types';
import type { FsApi } from '../fs-api';
import { basename, formatBytes, formatFullDate } from '../lib/format';

/** The renderer for one preview payload — shared by the side pane and the peek. */
export function PreviewBody({ data }: { data: PreviewPayload }): React.JSX.Element {
  if (data.error) return <div className="preview__none">{data.error}</div>;

  switch (data.kind) {
    case 'image':
      return <img className="preview__media" src={data.src} alt={basename(data.path)} />;
    case 'video':
      return <video className="preview__media" src={data.src} controls preload="metadata" />;
    case 'audio':
      return <audio style={{ width: '100%' }} src={data.src} controls preload="metadata" />;
    case 'pdf':
      return <iframe title={basename(data.path)} src={data.src} style={{ width: '100%', height: 420, border: 'none', background: '#fff' }} />;
    case 'text':
      return (
        <pre className="preview__text">
          {data.text}
          {data.truncated && '\n\n… truncated'}
        </pre>
      );
    case 'dir':
      return (
        <div className="preview__none">
          {data.childCount
            ? `${data.childCount.dirs} folder${data.childCount.dirs === 1 ? '' : 's'}, ${data.childCount.files} file${data.childCount.files === 1 ? '' : 's'}`
            : 'Folder'}
        </div>
      );
    case 'binary':
      return <div className="preview__none">No preview for this file type</div>;
    default:
      return <div className="preview__none">Nothing selected</div>;
  }
}

/**
 * Size / modified / path. A directory's `stat` size is 0 on Windows and means
 * nothing, so the row is dropped rather than printed as a confident "0 B" —
 * the real number is the folder-size column, computed separately.
 */
function PreviewMeta({ data }: { data: PreviewPayload }): React.JSX.Element {
  return (
    <dl className="preview__meta">
      {data.kind !== 'dir' && (
        <>
          <dt>Size</dt>
          <dd>{formatBytes(data.size)}</dd>
        </>
      )}
      <dt>Modified</dt>
      <dd>{formatFullDate(data.modified)}</dd>
      <dt>Path</dt>
      <dd>{data.path}</dd>
    </dl>
  );
}

/** Load a preview for `path`, cancelling cleanly when the selection moves on. */
export function usePreview(fsApi: FsApi, path: string | null): PreviewPayload | null {
  const [data, setData] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      return;
    }
    let cancelled = false;
    // Arrow-keying down a list fires a request per row; a short delay means we
    // only actually read the file the user stopped on.
    const timer = setTimeout(() => {
      void fsApi.preview(path).then((result) => {
        if (!cancelled) setData(result);
      });
    }, 90);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fsApi, path]);

  return data;
}

export function PreviewPane({
  fsApi,
  path,
  multiCount,
}: {
  fsApi: FsApi;
  path: string | null;
  /** How many items are selected — a multi-selection has no single preview. */
  multiCount: number;
}): React.JSX.Element {
  const data = usePreview(fsApi, multiCount === 1 ? path : null);

  return (
    <div className="preview">
      <div className="preview__head">{path ? basename(path) : 'Preview'}</div>
      <div className="preview__body">
        {multiCount > 1 ? (
          <div className="preview__none">{multiCount} items selected</div>
        ) : data ? (
          <PreviewBody data={data} />
        ) : (
          <div className="preview__none">Select a file to preview it</div>
        )}
      </div>
      {data && multiCount === 1 && <PreviewMeta data={data} />}
    </div>
  );
}

/** Space-to-peek: the same preview, full window. Space or Escape dismisses. */
export function Peek({
  fsApi,
  path,
  onClose,
}: {
  fsApi: FsApi;
  path: string;
  onClose: () => void;
}): React.JSX.Element {
  const data = usePreview(fsApi, path);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="peek" onMouseDown={onClose}>
      <div className="peek__inner" onMouseDown={(e) => e.stopPropagation()}>
        <div className="preview__head">{basename(path)}</div>
        <div className="peek__body">
          {data ? <PreviewBody data={data} /> : <div className="preview__none">Loading…</div>}
        </div>
        {data && <PreviewMeta data={data} />}
      </div>
    </div>
  );
}
