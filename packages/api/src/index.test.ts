import { describe, expect, it } from 'vitest';
import { type CancellationSignal } from '@repo/core';
import { createApiClient, createMockTransport } from './index.js';

describe('example API client', () => {
  it('lists examples through the transport contract', async () => {
    const client = createApiClient({ transport: createMockTransport({ latencyMs: 0 }) });

    await expect(client.listExamples()).resolves.toEqual([
      { id: 'welcome', title: '跨端模板', summary: '共享契约，两端保留原生体验。' },
      { id: 'theme', title: '主题切换', summary: '语义化颜色分别映射到两个 UI 系统。' },
      { id: 'errors', title: '错误状态', summary: '统一错误类型，由页面决定如何呈现。' },
    ]);
  });

  it('returns an empty collection for the empty scenario', async () => {
    const client = createApiClient({
      transport: createMockTransport({ latencyMs: 0, scenario: 'empty' }),
    });

    await expect(client.listExamples()).resolves.toEqual([]);
  });

  it.each(['network', 'timeout', 'invalid-response'] as const)(
    'surfaces the %s error kind',
    async (scenario) => {
      const client = createApiClient({
        transport: createMockTransport({ latencyMs: 0, scenario }),
      });

      await expect(client.listExamples()).rejects.toMatchObject({ kind: scenario });
    },
  );

  it('maps unsuccessful HTTP responses to an HTTP error', async () => {
    const client = createApiClient({
      baseUrl: 'https://example.invalid',
      transport: {
        request: async <TData>() => ({
          status: 503,
          data: { message: 'Unavailable' } as TData,
        }),
      },
    });

    await expect(client.listExamples()).rejects.toEqual(
      expect.objectContaining({ kind: 'http', status: 503 }),
    );
  });

  it('cancels an in-flight mock request', async () => {
    const listeners = new Set<() => void>();
    const signal: CancellationSignal = {
      aborted: false,
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
    };
    const client = createApiClient({ transport: createMockTransport({ latencyMs: 100 }) });
    const result = client.listExamples({ signal });

    for (const listener of listeners) listener();

    await expect(result).rejects.toMatchObject({ kind: 'cancelled' });
  });
});
