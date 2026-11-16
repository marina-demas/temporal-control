import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import type { ChildConfiguration, Part } from '../types';
import { renderWithClient } from '../test/utils';
import { ConfigTree } from './ConfigTree';

// Replace every function in api.ts with a mock, so no test touches the network.
vi.mock('../api');

const timeMachine: Part = {
  uuid: 'part-tm-1000',
  partNo: 'TM-1000',
  name: 'Time Machine',
  status: 'configuration',
  unit: 'set',
};

const safetySystem: Part = {
  uuid: 'part-tm-1210',
  partNo: 'TM-1210',
  name: 'Safety System',
  status: 'active',
  unit: 'set',
};

// Deliberately out of order, to check that the tree sorts them by serial number.
const endUnits: ChildConfiguration[] = [
  { uuid: 'unit-3', partUuid: timeMachine.uuid, quantity: 1, endUnitSerialNo: '00003' },
  { uuid: 'unit-1', partUuid: timeMachine.uuid, quantity: 1, endUnitSerialNo: '00001' },
  { uuid: 'unit-2', partUuid: timeMachine.uuid, quantity: 1, endUnitSerialNo: '00002' },
];

// Only end unit 00001 has a component. Units 00002 and 00003 have none.
const safetySystemConfig: ChildConfiguration = {
  uuid: 'config-safety',
  partUuid: safetySystem.uuid,
  quantity: 2,
  endUnitSerialNo: null,
};

function renderTree() {
  return renderWithClient(<ConfigTree selectedUuid={null} onSelect={vi.fn()} />);
}

// The names of the row buttons that select a part (not the Expand/Collapse toggles).
function selectButtonNames(): string[] {
  return screen
    .getAllByRole('button')
    .map((button) => button.textContent ?? '')
    .filter((text) => text.includes('TM-'));
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(api.getChildren).mockImplementation(async (parentUuid) => {
    if (parentUuid === undefined) return endUnits;
    if (parentUuid === 'unit-1') return [safetySystemConfig];
    return [];
  });

  vi.mocked(api.getPart).mockImplementation(async (uuid) =>
    uuid === safetySystem.uuid ? safetySystem : timeMachine,
  );
});

describe('ConfigTree', () => {
  it('shows the end units sorted by serial number', async () => {
    renderTree();

    await waitFor(() =>
      expect(selectButtonNames()).toEqual([
        '00001 TM-1000 Time Machine',
        '00002 TM-1000 Time Machine',
        '00003 TM-1000 Time Machine',
      ]),
    );
  });

  it('shows a row\'s children when it is expanded', async () => {
    const user = userEvent.setup();
    renderTree();

    expect(screen.queryByText(/TM-1210/)).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Expand' }));

    expect(await screen.findByText('TM-1210 Safety System x2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('shows no expand arrow on rows without children', async () => {
    renderTree();

    // Wait until every row has asked for its children: 1 request for the end units, plus 1 per row.
    await waitFor(() => expect(api.getChildren).toHaveBeenCalledTimes(4));
    await screen.findByRole('button', { name: 'Expand' });

    // Three rows are on screen, but only 00001 has something to expand.
    expect(screen.getAllByRole('button', { name: 'Expand' })).toHaveLength(1);
  });
});
