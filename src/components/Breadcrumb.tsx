import { usePart } from '../hooks';
import type { ChildConfiguration } from '../types';
import type { SelectedNode } from './ConfigTree';

interface BreadcrumbProps {
  path: ChildConfiguration[]; // end unit first, selected config last
  onSelect: (node: SelectedNode) => void;
}

export function Breadcrumb({ path, onSelect }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {path.map((config, index) => (
          <BreadcrumbItem
            key={config.uuid}
            config={config}
            isLast={index === path.length - 1}
            // Selecting an item means the path up to and including it.
            onSelect={() => onSelect({ config, path: path.slice(0, index + 1) })}
          />
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  config: ChildConfiguration;
  isLast: boolean;
  onSelect: () => void;
}

function BreadcrumbItem({ config, isLast, onSelect }: BreadcrumbItemProps) {
  // Parts are cached by the tree, so this normally doesn't make a request.
  const part = usePart(config.partUuid);

  let label: string;
  if (config.endUnitSerialNo) {
    // The end unit is shown by its serial number, like "00001".
    label = config.endUnitSerialNo;
  } else if (part.data) {
    label = `${part.data.partNo} ${part.data.name}`;
  } else if (part.error) {
    label = 'Unknown part';
  } else {
    label = '...';
  }

  return (
    <li className="breadcrumb-item" aria-current={isLast ? 'location' : undefined}>
      {isLast ? (
        // The last item is the part already shown, so it is plain text.
        label
      ) : (
        <button type="button" className="breadcrumb-link" onClick={onSelect}>
          {label}
        </button>
      )}
    </li>
  );
}
