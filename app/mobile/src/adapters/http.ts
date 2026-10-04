import { ApiError, type HttpRequest, type HttpResponse, type HttpTransport } from '@repo/core';

export interface FetchHeadersLike {
  forEach(callback: (value: string, key: string) => void): void;
}

export interface FetchResponseLike {
  readonly status: number;
  readonly headers?: FetchHeadersLike;
  text(): Promise<string>;
}

export interface FetchInitLike {
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly signal: AbortSignal;
}

export type FetchLike = (url: string, init: FetchInitLike) => Promise<FetchResponseLike>;

export function createFetchTransport(fetchImpl: FetchLike = fetch): HttpTransport {
  return {
    request: async <TData>(request: HttpRequest): Promise<HttpResponse<TData>> => {
      if (request.signal?.aborted) {
        throw new ApiError('cancelled', 'The request was cancelled.');
      }

      const controller = new AbortController();
      let timedOut = false;
      const onExternalAbort = () => controller.abort();
      request.signal?.addEventListener('abort', onExternalAbort);
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, request.timeoutMs ?? 10_000);

      try {
        const hasBody = request.body !== undefined;
        const response = await fetchImpl(request.url, {
          method: request.method ?? 'GET',
          headers: {
            Accept: 'application/json',
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            ...request.headers,
          },
          body: hasBody ? JSON.stringify(request.body) : undefined,
          signal: controller.signal,
        });
        const responseHeaders: Record<string, string> = {};
        response.headers?.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        const text = await response.text();
        let data: unknown = null;

        if (text.length > 0) {
          try {
            data = JSON.parse(text) as unknown;
          } catch {
            throw new ApiError('invalid-response', 'The server returned malformed JSON.');
          }
        }

        return { status: response.status, data: data as TData, headers: responseHeaders };
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (timedOut) throw new ApiError('timeout', 'The request timed out.');
        if (request.signal?.aborted) {
          throw new ApiError('cancelled', 'The request was cancelled.');
        }
        throw new ApiError('network', 'The request could not be completed.');
      } finally {
        clearTimeout(timeout);
        request.signal?.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}
