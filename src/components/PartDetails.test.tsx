import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import type { ChildConfiguration, Part, PartStatus } from '../types';
import { renderWithClient } from '../test/utils';
import { PartDetails } from './PartDetails';

// Replace every function in api.ts with a mock. The real hooks still run on top of
// them, so these tests cover the component and its hooks, but never touch the network.
vi.mock('../api');

const config: ChildConfiguration = {
  uuid: 'config-1',
  partUuid: 'part-1',
  quantity: 1,
  endUnitSerialNo: null,
};

const part: Part = {
  uuid: 'part-1',
  partNo: 'TM-1210',
  name: 'Safety System',
  status: 'active',
  unit: 'set',
};

// Set what the API returns for this part's allowable statuses.
function setAllowableStatuses(allowableStatuses: PartStatus[]) {
  vi.mocked(api.getAllowableStatuses).mockResolvedValue({
    partUuid: part.uuid,
    currentStatus: part.status,
    allowableStatuses,
  });
}

function renderPartDetails() {
  return renderWithClient(
    <PartDetails node={{ config, path: [config] }} onSelect={vi.fn()} />,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getPart).mockResolvedValue(part);
});

describe('PartDetails status dropdown', () => {
  it('only offers the allowable statuses', async () => {
    setAllowableStatuses(['active', 'deprecated', 'recalled']);
    renderPartDetails();

    const select = await screen.findByLabelText(/new status/i);
    const optionValues = within(select)
      .getAllByRole('option')
      .map((option) => option.getAttribute('value'));

    expect(optionValues).toEqual(['active', 'deprecated', 'recalled']);
  });

  it('shows "No status changes available" when only the current status is allowed', async () => {
    setAllowableStatuses(['active']);
    renderPartDetails();

    expect(await screen.findByText(/no status changes available/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
  });

  it('keeps Update disabled until a different status is picked', async () => {
    const user = userEvent.setup();
    setAllowableStatuses(['active', 'deprecated']);
    renderPartDetails();

    const select = await screen.findByLabelText(/new status/i);
    const updateButton = screen.getByRole('button', { name: 'Update' });

    // Nothing picked yet: the dropdown shows the current status.
    expect(updateButton).toBeDisabled();

    await user.selectOptions(select, 'deprecated');
    expect(updateButton).toBeEnabled();

    // Going back to the current status disables it again.
    await user.selectOptions(select, 'active');
    expect(updateButton).toBeDisabled();
  });
});

describe('PartDetails status update', () => {
  it('sends the lowercase status and shows the success message', async () => {
    const user = userEvent.setup();
    setAllowableStatuses(['active', 'deprecated']);
    vi.mocked(api.updatePart).mockResolvedValue({ ...part, status: 'deprecated' });
    renderPartDetails();

    await user.selectOptions(await screen.findByLabelText(/new status/i), 'deprecated');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(api.updatePart).toHaveBeenCalledWith('part-1', { status: 'deprecated' });
    expect(await screen.findByText('Status updated to Deprecated.')).toBeInTheDocument();
  });
});
