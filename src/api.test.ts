import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPart, updatePart } from './api';
import { ApiError } from './types';

// Build a fake fetch Response. Only the parts api.ts uses are needed.
function fakeResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

// Replace the global fetch for one test and return the mock so we can inspect calls.
function mockFetch(result: Response | Error) {
  const fetchMock = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API error handling', () => {
  it('throws an ApiError with the API message and allowableStatuses', async () => {
    mockFetch(
      fakeResponse(400, {
        error: 'Invalid status change',
        allowableStatuses: ['active', 'deprecated'],
      }),
    );

    const error = await updatePart('part-1', { status: 'draft' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Invalid status change');
    expect(error.allowableStatuses).toEqual(['active', 'deprecated']);
  });

  it('falls back to a generic message when the error response has no JSON body', async () => {
    mockFetch(fakeResponse(500));

    const error = await getPart('part-1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Request failed (500)');
    expect(error.allowableStatuses).toBeUndefined();
  });

  it('throws a friendly message when the server cannot be reached', async () => {
    mockFetch(new TypeError('Failed to fetch'));

    const error = await getPart('part-1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(
      'Could not reach the server. Check your internet connection and try again.',
    );
  });
});

describe('API requests', () => {
  it('sends the API key header', async () => {
    const fetchMock = mockFetch(fakeResponse(200, { uuid: 'part-1' }));

    await getPart('part-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/parts/part-1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      }),
    );
  });

  it('updatePart sends a PUT with the status in the JSON body', async () => {
    const fetchMock = mockFetch(fakeResponse(200, { uuid: 'part-1', status: 'deprecated' }));

    await updatePart('part-1', { status: 'deprecated' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/parts/part-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'deprecated' }),
      }),
    );
  });
});
