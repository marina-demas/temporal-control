import { usePart } from '../hooks';
import type { ChildConfiguration } from '../types';

interface BreadcrumbProps {
  path: ChildConfiguration[]; // end unit first, selected config last
}

export function Breadcrumb({ path }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {path.map((config, index) => (
          <BreadcrumbItem
            key={config.uuid}
            config={config}
            isLast={index === path.length - 1}
          />
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  config: ChildConfiguration;
  isLast: boolean;
}

function BreadcrumbItem({ config, isLast }: BreadcrumbItemProps) {
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
      {label}
    </li>
  );
}
