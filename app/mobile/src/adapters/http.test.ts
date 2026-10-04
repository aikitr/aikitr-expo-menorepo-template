import { describe, expect, it } from 'vitest';
import { createFetchTransport, type FetchLike } from './http.js';

describe('fetch transport', () => {
  it('serializes a JSON request and parses its response', async () => {
    let receivedBody: string | undefined;
    const fetchImpl: FetchLike = async (_url, init) => {
      receivedBody = init.body;
      return {
        status: 201,
        headers: { forEach: () => undefined },
        text: async () => '{"ok":true}',
      };
    };
    const transport = createFetchTransport(fetchImpl);

    const response = await transport.request<{ ok: boolean }>({
      url: 'https://example.invalid/items',
      method: 'POST',
      body: { name: 'Ada' },
    });

    expect(receivedBody).toBe('{"name":"Ada"}');
    expect(response).toEqual({ status: 201, data: { ok: true }, headers: {} });
  });

  it('rejects malformed JSON as an invalid response', async () => {
    const transport = createFetchTransport(async () => ({
      status: 200,
      text: async () => 'not-json',
    }));

    await expect(transport.request({ url: 'https://example.invalid/items' })).rejects.toMatchObject(
      { kind: 'invalid-response' },
    );
  });

  it('maps a rejected fetch to a network error', async () => {
    const transport = createFetchTransport(async () => {
      throw new Error('offline');
    });

    await expect(transport.request({ url: 'https://example.invalid/items' })).rejects.toMatchObject(
      { kind: 'network' },
    );
  });

  it('aborts and reports a timeout', async () => {
    const transport = createFetchTransport(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    await expect(
      transport.request({ url: 'https://example.invalid/items', timeoutMs: 1 }),
    ).rejects.toMatchObject({ kind: 'timeout' });
  });
});
