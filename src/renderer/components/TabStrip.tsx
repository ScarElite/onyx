import React from 'react';
import type { TabState } from '../../shared/types';
import { basename } from '../lib/format';
import { collectLeaves, findLeaf } from '../lib/paneTree';
import { Icon } from './ui';

/** A tab is named after its active pane's folder — the thing you're looking at. */
function tabLabel(tab: TabState): string {
  const active = findLeaf(tab.root, tab.activePaneId) ?? collectLeaves(tab.root)[0];
  const name = basename(active.path) || active.path;
  const panes = collectLeaves(tab.root).length;
  return panes > 1 ? `${name} +${panes - 1}` : name;
}

export function TabStrip({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onNew,
}: {
  tabs: TabState[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}): React.JSX.Element {
  return (
    <div className="tabstrip">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab${tab.id === activeTabId ? ' tab--active' : ''}`}
          onMouseDown={(e) => {
            // Middle-click closes, matching every browser and editor.
            if (e.button === 1) {
              e.preventDefault();
              onClose(tab.id);
            } else if (e.button === 0) {
              onSelect(tab.id);
            }
          }}
          title={findLeaf(tab.root, tab.activePaneId)?.path ?? ''}>
          <span className="tab__label">{tabLabel(tab)}</span>
          <button
            type="button"
            className="tab__close"
            title="Close tab (Ctrl+W)"
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="tabstrip__new" title="New tab (Ctrl+T)" onClick={onNew}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
