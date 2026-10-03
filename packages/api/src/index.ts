import {
  ApiError,
  parseExampleItem,
  parseExampleItems,
  type CancellationSignal,
  type ExampleItem,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
} from '@repo/core';

export interface ApiRequestOptions {
  readonly signal?: CancellationSignal;
}

export interface ApiClient {
  listExamples(options?: ApiRequestOptions): Promise<ExampleItem[]>;
  getExample(id: string, options?: ApiRequestOptions): Promise<ExampleItem>;
}

export interface CreateApiClientOptions {
  readonly transport: HttpTransport;
  readonly baseUrl?: string;
}

export type MockScenario = 'success' | 'empty' | 'network' | 'timeout' | 'invalid-response';

export interface MockTransportOptions {
  readonly latencyMs?: number;
  readonly scenario?: MockScenario;
}

const EXAMPLES: readonly ExampleItem[] = [
  { id: 'welcome', title: '跨端模板', summary: '共享契约，两端保留原生体验。' },
  { id: 'theme', title: '主题切换', summary: '语义化颜色分别映射到两个 UI 系统。' },
  { id: 'errors', title: '错误状态', summary: '统一错误类型，由页面决定如何呈现。' },
];

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function requestData(
  transport: HttpTransport,
  url: string,
  options: ApiRequestOptions,
): Promise<unknown> {
  try {
    const response = await transport.request({
      url,
      method: 'GET',
      signal: options.signal,
      timeoutMs: 10_000,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new ApiError('http', `Request failed with status ${response.status}.`, {
        status: response.status,
      });
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('network', 'The request could not be completed.');
  }
}

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl ?? '';

  return {
    listExamples: async (requestOptions = {}) => {
      const data = await requestData(
        options.transport,
        joinUrl(baseUrl, '/examples'),
        requestOptions,
      );
      return parseExampleItems(data);
    },
    getExample: async (id, requestOptions = {}) => {
      const data = await requestData(
        options.transport,
        joinUrl(baseUrl, `/examples/${encodeURIComponent(id)}`),
        requestOptions,
      );
      return parseExampleItem(data);
    },
  };
}

function waitForDelay(delayMs: number, signal?: CancellationSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new ApiError('cancelled', 'The request was cancelled.'));
  }

  return new Promise((resolve, reject) => {
    const timerHost = globalThis as unknown as {
      setTimeout(handler: () => void, timeout: number): unknown;
      clearTimeout(handle: unknown): void;
    };
    let timer: unknown = undefined;
    const cleanup = () => {
      if (timer !== undefined) timerHost.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new ApiError('cancelled', 'The request was cancelled.'));
    };

    signal?.addEventListener('abort', onAbort);
    timer = timerHost.setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);
  });
}

function pathFromUrl(url: string): string {
  return url.replace(/^[a-z][a-z\d+.-]*:\/\/[^/]+/i, '').split('?')[0] ?? '/';
}

export function createMockTransport(options: MockTransportOptions = {}): HttpTransport {
  const { latencyMs = 250, scenario = 'success' } = options;

  return {
    request: async <TData>(request: HttpRequest): Promise<HttpResponse<TData>> => {
      const { url, signal } = request;
      await waitForDelay(latencyMs, signal);

      if (scenario === 'network') {
        throw new ApiError('network', 'Mock network failure.');
      }
      if (scenario === 'timeout') {
        throw new ApiError('timeout', 'Mock request timed out.');
      }
      if (scenario === 'invalid-response') {
        return { status: 200, data: { unexpected: true } as TData };
      }

      const path = pathFromUrl(url);
      if (path === '/examples') {
        const items = scenario === 'empty' ? [] : EXAMPLES;
        return { status: 200, data: items as TData };
      }

      const id = decodeURIComponent(path.replace('/examples/', ''));
      const item = EXAMPLES.find((candidate) => candidate.id === id);
      return item
        ? { status: 200, data: item as TData }
        : { status: 404, data: { message: 'Example not found.' } as TData };
    },
  };
}
