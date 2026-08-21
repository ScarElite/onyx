import React, { useCallback, useRef, useState } from 'react';
import type { PaneLeaf, PaneNode } from '../../shared/types';

/**
 * Renders the pane tree, with draggable dividers between splits.
 *
 * Ratio changes are pushed up on every mousemove rather than kept locally — the
 * tree is the single source of truth, and a local copy would drift the moment a
 * pane is closed or the session is restored.
 */
export function PaneTreeView({
  node,
  renderLeaf,
  onRatioChange,
}: {
  node: PaneNode;
  renderLeaf: (leaf: PaneLeaf) => React.ReactNode;
  onRatioChange: (splitId: string, ratio: number) => void;
}): React.JSX.Element {
  if (node.type === 'leaf') {
    return <>{renderLeaf(node)}</>;
  }

  return (
    <Split node={node} renderLeaf={renderLeaf} onRatioChange={onRatioChange} />
  );
}

function Split({
  node,
  renderLeaf,
  onRatioChange,
}: {
  node: Extract<PaneNode, { type: 'split' }>;
  renderLeaf: (leaf: PaneLeaf) => React.ReactNode;
  onRatioChange: (splitId: string, ratio: number) => void;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      setDragging(true);

      const onMove = (ev: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const ratio =
          node.dir === 'h'
            ? (ev.clientX - rect.left) / rect.width
            : (ev.clientY - rect.top) / rect.height;
        if (Number.isFinite(ratio)) onRatioChange(node.id, ratio);
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        // Text selection is disabled globally, but the iframe/video children in
        // a preview can still steal the cursor mid-drag.
        document.body.style.cursor = '';
      };

      document.body.style.cursor = node.dir === 'h' ? 'col-resize' : 'row-resize';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [node.dir, node.id, onRatioChange],
  );

  const aStyle = { flex: `${node.ratio} 1 0`, minWidth: 0, minHeight: 0, display: 'flex' };
  const bStyle = { flex: `${1 - node.ratio} 1 0`, minWidth: 0, minHeight: 0, display: 'flex' };

  return (
    <div ref={containerRef} className={`panetree panetree--${node.dir}`}>
      <div style={aStyle}>
        <PaneTreeView node={node.a} renderLeaf={renderLeaf} onRatioChange={onRatioChange} />
      </div>
      <div
        className={`divider divider--${node.dir}${dragging ? ' divider--dragging' : ''}`}
        onMouseDown={startDrag}
        role="separator"
        aria-orientation={node.dir === 'h' ? 'vertical' : 'horizontal'}
      />
      <div style={bStyle}>
        <PaneTreeView node={node.b} renderLeaf={renderLeaf} onRatioChange={onRatioChange} />
      </div>
    </div>
  );
}
