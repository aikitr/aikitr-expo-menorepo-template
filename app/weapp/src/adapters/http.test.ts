import { describe, expect, it } from 'vitest';
import type { CancellationSignal } from '@repo/core';
import { createTaroTransport, type TaroRequestLike } from './http';

describe('Taro request transport', () => {
  it('passes JSON request data and returns the response', async () => {
    let receivedData: unknown;
    const request: TaroRequestLike = (options) => {
      receivedData = options.data;
      options.success({ statusCode: 200, data: { ok: true }, header: { trace: 'abc' } });
      return { abort: () => undefined };
    };
    const transport = createTaroTransport(request);

    const response = await transport.request<{ ok: boolean }>({
      url: 'https://example.invalid/items',
      method: 'POST',
      body: { name: 'Ada' },
    });

    expect(receivedData).toEqual({ name: 'Ada' });
    expect(response).toEqual({ status: 200, data: { ok: true }, headers: { trace: 'abc' } });
  });

  it('maps a Taro timeout failure', async () => {
    const request: TaroRequestLike = (options) => {
      options.fail({ errMsg: 'request:fail timeout' });
      return { abort: () => undefined };
    };

    await expect(
      createTaroTransport(request).request({ url: 'https://example.invalid/items' }),
    ).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('aborts the request task when the caller cancels', async () => {
    let aborted = false;
    let isAborted = false;
    const listeners = new Set<() => void>();
    const signal: CancellationSignal = {
      get aborted() {
        return isAborted;
      },
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
    };
    const request: TaroRequestLike = () => ({ abort: () => (aborted = true) });
    const result = createTaroTransport(request).request({
      url: 'https://example.invalid/items',
      signal,
    });

    isAborted = true;
    for (const listener of listeners) listener();

    await expect(result).rejects.toMatchObject({ kind: 'cancelled' });
    expect(aborted).toBe(true);
  });
});
