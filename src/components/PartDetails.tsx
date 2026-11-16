import { useState } from 'react';
import { useAllowableStatuses, useOnlineStatus, usePart, useUpdatePart } from '../hooks';
import { ApiError } from '../types';
import type { PartStatus } from '../types';
import { Breadcrumb } from './Breadcrumb';
import type { SelectedNode } from './ConfigTree';

// Which color each status gets. Typed as Record<PartStatus, ...> so TypeScript
// reports an error if a new status is added to the API types but not styled here.
const BADGE_COLOR: Record<PartStatus, string> = {
  active: 'badge--green',
  configuration: 'badge--gray',
  draft: 'badge--gray',
  experimental: 'badge--blue',
  deprecated: 'badge--amber',
  recalled: 'badge--red',
  obsolete: 'badge--dark',
  retired: 'badge--dark',
};

// "active" -> "Active". Used for the dropdown text only; the option's value
// stays lowercase because that is what the API expects.
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The status word is always shown, so the meaning never depends on color alone.
function StatusBadge({ status }: { status: PartStatus }) {
  return <span className={`badge ${BADGE_COLOR[status]}`}>{status}</span>;
}

interface PartDetailsProps {
  node: SelectedNode;
  onSelect: (node: SelectedNode) => void; // used by the breadcrumb
}

export function PartDetails({ node, onSelect }: PartDetailsProps) {
  const { config } = node;
  const part = usePart(config.partUuid);
  const allowable = useAllowableStatuses(config.partUuid);
  const update = useUpdatePart(config.partUuid);
  const isOnline = useOnlineStatus();
  // null means "the user hasn't picked anything", so we show the current status.
  const [pickedStatus, setPickedStatus] = useState<PartStatus | null>(null);

  // isPending also covers queries paused while offline (isLoading does not).
  if (part.isPending) return <p>Loading part...</p>;
  if (part.error) return <p role="alert">Could not load part: {part.error.message}</p>;
  if (!part.data) return null;

  const { partNo, name, unit, status } = part.data;
  // Nothing picked yet: show the current status, or a placeholder if it isn't an option.
  const options = allowable.data?.allowableStatuses ?? [];
  const currentIsOption = options.includes(status);
  const selectValue = pickedStatus ?? (currentIsOption ? status : '');
  const canUpdate = pickedStatus !== null && pickedStatus !== status;

  function handleStatusChange(value: string) {
    // Look the value up in the allowed list so we get a real PartStatus (no cast needed).
    const match = options.find((s) => s === value);
    if (!match) return;
    setPickedStatus(match);
    update.reset(); // clear the previous success or error message
  }

  function handleUpdate() {
    if (pickedStatus === null) return;
    update.mutate({ status: pickedStatus });
  }

  return (
    <div>
      <Breadcrumb path={node.path} onSelect={onSelect} />
      <h2>
        {partNo} {name}
      </h2>
      <dl className="details-list">
        {config.endUnitSerialNo && (
          <>
            <dt>Serial number</dt>
            <dd>{config.endUnitSerialNo}</dd>
          </>
        )}
        <dt>Part number</dt>
        <dd>{partNo}</dd>
        <dt>Name</dt>
        <dd>{name}</dd>
        <dt>Unit</dt>
        <dd>{unit}</dd>
        <dt>Current status</dt>
        <dd>
          <StatusBadge status={status} />
        </dd>
        <dt>Quantity</dt>
        <dd>{config.quantity}</dd>
      </dl>

      <h3>Change status</h3>
      {allowable.isPending && <p>Loading allowed statuses...</p>}
      {allowable.error && (
        <p role="alert">Could not load allowed statuses: {allowable.error.message}</p>
      )}
      {allowable.data && (
        <>
          {allowable.data.allowableStatuses.every((s) => s === status) ? (
            <p>No status changes available for this part</p>
          ) : (
            <div>
              <div className="status-controls">
                <label>
                  New status{' '}
                  <select
                    value={selectValue}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={update.isPending}
                  >
                    {!currentIsOption && (
                      <option value="" disabled>
                        Choose a status
                      </option>
                    )}
                    {options.map((s) => (
                      <option key={s} value={s}>
                        {capitalize(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={update.isPending || !canUpdate || !isOnline}
                >
                  {update.isPending ? 'Saving...' : 'Update'}
                </button>
              </div>
              {!isOnline && <p>Reconnect to save changes.</p>}
              <p className="applies-note">
                This updates {partNo} everywhere it's used.
              </p>
            </div>
          )}
        </>
      )}

      {update.isSuccess && (
        <p role="status">Status updated to {capitalize(update.data.status)}.</p>
      )}
      {update.error && (
        <div role="alert">
          <p>Could not update status: {update.error.message}</p>
          {update.error instanceof ApiError && update.error.allowableStatuses && (
            <p>
              Allowed statuses: {update.error.allowableStatuses.map(capitalize).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
