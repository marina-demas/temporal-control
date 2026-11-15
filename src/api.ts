import { ApiError } from './types';
import type {
  AllowableStatuses,
  ChildConfiguration,
  Part,
  PartStatus,
  UpdatePartBody,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

// Fail loudly at startup if .env is missing or incomplete.
if (!BASE_URL || !API_KEY) {
  throw new Error(
    'Missing configuration: set VITE_API_BASE_URL and VITE_API_KEY in your .env file.',
  );
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    // fetch only rejects when the request never reached the server.
    throw new ApiError(
      'Could not reach the server. Check your internet connection and try again.',
    );
  }

  if (!response.ok) {
    let body: { error?: string; allowableStatuses?: PartStatus[] } = {};
    try {
      body = await response.json();
    } catch {
      // Response had no JSON body; fall back to the generic message below.
    }
    throw new ApiError(
      body.error ?? `Request failed (${response.status})`,
      body.allowableStatuses,
    );
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