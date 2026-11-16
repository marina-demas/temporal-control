import { useState } from 'react';
import { useAllowableStatuses, usePart, useUpdatePart } from '../hooks';
import { ApiError } from '../types';
import type { PartStatus } from '../types';
import { Breadcrumb } from './Breadcrumb';
import type { SelectedNode } from './ConfigTree';

interface PartDetailsProps {
  node: SelectedNode;
}

export function PartDetails({ node }: PartDetailsProps) {
  const { config } = node;
  const part = usePart(config.partUuid);
  const allowable = useAllowableStatuses(config.partUuid);
  const update = useUpdatePart(config.partUuid);
  // null means "the user hasn't picked anything", so we show the current status.
  const [pickedStatus, setPickedStatus] = useState<PartStatus | null>(null);

  if (part.isLoading) return <p>Loading part...</p>;
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
      <Breadcrumb path={node.path} />
      <h2>
        {partNo} {name}
      </h2>
      <dl>
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
        <dd>{status}</dd>
        <dt>Quantity</dt>
        <dd>{config.quantity}</dd>
      </dl>

      <h3>Change status</h3>
      {allowable.isLoading && <p>Loading allowed statuses...</p>}
      {allowable.error && (
        <p role="alert">Could not load allowed statuses: {allowable.error.message}</p>
      )}
      {allowable.data && (
        <>
          {allowable.data.allowableStatuses.every((s) => s === status) ? (
            <p>No status changes available for this part</p>
          ) : (
            <div>
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
                      {s}
                    </option>
                  ))}
                </select>
              </label>{' '}
              <button
                type="button"
                onClick={handleUpdate}
                disabled={update.isPending || !canUpdate}
              >
                {update.isPending ? 'Saving...' : 'Update'}
              </button>{' '}
              <span>This updates {partNo} everywhere it's used.</span>
            </div>
          )}
        </>
      )}

      {update.isSuccess && <p role="status">Status updated to {update.data.status}.</p>}
      {update.error && (
        <div role="alert">
          <p>Could not update status: {update.error.message}</p>
          {update.error instanceof ApiError && update.error.allowableStatuses && (
            <p>Allowed statuses: {update.error.allowableStatuses.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
