import type {
  ApiError,
  AllowableStatuses,
  ChildConfiguration,
  Part,
  UpdatePartBody,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      error = await response.json();
    } catch {
      error = { error: `Request failed (${response.status})` };
    }
    throw error;
  }

  return response.json();
}

export function getChildren(parentUuid?: string) {
  const query = parentUuid ? `?parentUuid=${encodeURIComponent(parentUuid)}` : '';
  return request<ChildConfiguration[]>(`/configs/children${query}`);
}

export function getPart(uuid: string) {
  return request<Part>(`/parts/${uuid}`);
}

export function getAllowableStatuses(uuid: string) {
  return request<AllowableStatuses>(`/parts/${uuid}/allowable-statuses`);
}

export function updatePart(uuid: string, body: UpdatePartBody) {
  return request<Part>(`/parts/${uuid}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}