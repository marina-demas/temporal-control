// All possible part statuses.
export type PartStatus =
  | 'configuration'
  | 'active'
  | 'draft'
  | 'deprecated'
  | 'obsolete'
  | 'experimental'
  | 'retired'
  | 'recalled';

// A part definition: the blueprint, shared across configurations.
export interface Part {
  uuid: string;
  partNo: string;
  name: string;
  status: PartStatus;
  unit: string;
}

// One node in the configuration tree.
export interface ChildConfiguration {
  uuid: string;
  partUuid: string;
  quantity: number;
  endUnitSerialNo: string | null; // only set on top-level machines
}

// The statuses a part is allowed to change to.
export interface AllowableStatuses {
  partUuid: string;
  currentStatus: PartStatus;
  allowableStatuses: PartStatus[];
}

// Body for updating a part. Both fields are optional.
export interface UpdatePartBody {
  unit?: string;
  status?: PartStatus;
}

// The error thrown for every failed request, including network failures.
export class ApiError extends Error {
  error: string;
  allowableStatuses?: PartStatus[]; // included on invalid status changes

  constructor(error: string, allowableStatuses?: PartStatus[]) {
    super(error);
    this.name = 'ApiError';
    this.error = error;
    this.allowableStatuses = allowableStatuses;
  }
}