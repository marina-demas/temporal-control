import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useChildren, usePart } from '../hooks';
import type { ChildConfiguration } from '../types';

// What onSelect receives: the clicked config, plus the path from the
// end unit down to it. The path includes the selected config as its last item.
export interface SelectedNode {
  config: ChildConfiguration;
  path: ChildConfiguration[];
}

interface ConfigTreeProps {
  // The selection lives in App, so the tree only displays it. This lets other
  // parts of the page (like the breadcrumb) change it and the highlight follows.
  selectedUuid: string | null;
  onSelect: (node: SelectedNode) => void;
}

export function ConfigTree({ selectedUuid, onSelect }: ConfigTreeProps) {
  const { data, isPending, fetchStatus, error } = useChildren();

  // isPending also covers queries paused while offline (isLoading does not).
  // A paused query isn't loading, it's waiting for the connection, so say that.
  if (isPending) {
    return (
      <p>{fetchStatus === 'paused' ? 'Waiting for connection...' : 'Loading end units...'}</p>
    );
  }
  if (error) return <p role="alert">Could not load end units: {error.message}</p>;

  // Copy before sorting so we don't mutate the cached query data.
  const endUnits = [...(data ?? [])].sort((a, b) =>
    (a.endUnitSerialNo ?? '').localeCompare(b.endUnitSerialNo ?? ''),
  );

  return (
    <ul className="tree-list">
      {endUnits.map((config) => (
        <ConfigRow
          key={config.uuid}
          config={config}
          parentPath={[]}
          depth={0}
          selectedUuid={selectedUuid}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

interface ConfigRowProps {
  config: ChildConfiguration;
  parentPath: ChildConfiguration[]; // ancestors, not including this config
  depth: number;
  selectedUuid: string | null;
  onSelect: (node: SelectedNode) => void;
}

function ConfigRow({ config, parentPath, depth, selectedUuid, onSelect }: ConfigRowProps) {
  const [expanded, setExpanded] = useState(false);
  const part = usePart(config.partUuid);
  // Every row asks for its children as soon as it renders, so we know right away
  // whether to show a toggle. Rows only render once their parent is expanded,
  // so only the rows on screen make this request.
  const children = useChildren(config.uuid);

  const path = [...parentPath, config];
  const isSelected = selectedUuid === config.uuid;
  const isEndUnit = depth === 0;
  // Only show the toggle once we know there is something to expand.
  // While loading (or if the request failed) we show a blank spacer instead.
  const hasChildren = children.data !== undefined && children.data.length > 0;

  return (
    <li>
      <div
        className={isSelected ? 'tree-row tree-row--selected' : 'tree-row'}
        style={depthStyle(depth)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          // Same width as the toggle, so labels line up with rows that have one.
          <span className="tree-toggle-spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => onSelect({ config, path })}
          aria-current={isSelected}
          className="tree-row-select"
        >
          {isEndUnit && <strong>{config.endUnitSerialNo} </strong>}
          {part.isPending &&
            (part.fetchStatus === 'paused' ? 'Waiting for connection...' : 'Loading part...')}
          {part.error && `Could not load part: ${part.error.message}`}
          {part.data && `${part.data.partNo} ${part.data.name}`}
          {!isEndUnit && ` x${config.quantity}`}
        </button>
      </div>

      {/* A failed request is shown on the row, so it isn't mistaken for "no components". */}
      {children.error && (
        <p role="alert" className="tree-message" style={depthStyle(depth + 1)}>
          Could not load components: {children.error.message}
        </p>
      )}

      {expanded && children.data && children.data.length > 0 && (
        <ul className="tree-list">
          {children.data.map((child) => (
            <ConfigRow
              key={child.uuid}
              config={child}
              parentPath={path}
              depth={depth + 1}
              selectedUuid={selectedUuid}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// The one inline style left: it passes the nesting depth to the CSS
// (see .tree-row in App.css), which turns it into indentation.
function depthStyle(depth: number): CSSProperties & Record<'--depth', number> {
  return { '--depth': depth };
}
