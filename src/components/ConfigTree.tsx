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
  onSelect: (node: SelectedNode) => void;
}

export function ConfigTree({ onSelect }: ConfigTreeProps) {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const { data, isLoading, error } = useChildren();

  function handleSelect(node: SelectedNode) {
    setSelectedUuid(node.config.uuid);
    onSelect(node);
  }

  if (isLoading) return <p>Loading end units...</p>;
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
          onSelect={handleSelect}
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
  // Children are only requested once the row is expanded.
  const children = useChildren(config.uuid, expanded);

  const path = [...parentPath, config];
  const isSelected = selectedUuid === config.uuid;
  const isEndUnit = depth === 0;

  return (
    <li>
      <div
        className={isSelected ? 'tree-row tree-row--selected' : 'tree-row'}
        style={depthStyle(depth)}
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          onClick={() => onSelect({ config, path })}
          aria-current={isSelected}
          className="tree-row-select"
        >
          {isEndUnit && <strong>{config.endUnitSerialNo} </strong>}
          {part.isLoading && 'Loading part...'}
          {part.error && `Could not load part: ${part.error.message}`}
          {part.data && `${part.data.partNo} ${part.data.name}`}
          {!isEndUnit && ` x${config.quantity}`}
        </button>
      </div>

      {expanded && (
        <div>
          {children.isLoading && (
            <p className="tree-message" style={depthStyle(depth + 1)}>
              Loading...
            </p>
          )}
          {children.error && (
            <p role="alert" className="tree-message" style={depthStyle(depth + 1)}>
              Could not load components: {children.error.message}
            </p>
          )}
          {children.data && children.data.length === 0 && (
            <p className="tree-message" style={depthStyle(depth + 1)}>
              No components
            </p>
          )}
          {children.data && children.data.length > 0 && (
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
        </div>
      )}
    </li>
  );
}

// The one inline style left: it passes the nesting depth to the CSS
// (see .tree-row in App.css), which turns it into indentation.
function depthStyle(depth: number): CSSProperties & Record<'--depth', number> {
  return { '--depth': depth };
}
