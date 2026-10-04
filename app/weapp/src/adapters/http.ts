import { ApiError, type HttpRequest, type HttpResponse, type HttpTransport } from '@repo/core';

export interface TaroResponseLike {
  readonly statusCode: number;
  readonly data: unknown;
  readonly header?: Readonly<Record<string, string>>;
}

export interface TaroFailureLike {
  readonly errMsg: string;
}

export interface TaroRequestOptionsLike {
  readonly url: string;
  readonly method: string;
  readonly header: Readonly<Record<string, string>>;
  readonly data?: unknown;
  readonly timeout: number;
  success(response: TaroResponseLike): void;
  fail(error: TaroFailureLike): void;
}

export interface TaroRequestTaskLike {
  abort(): void;
}

export type TaroRequestLike = (options: TaroRequestOptionsLike) => TaroRequestTaskLike;

function mapFailure(error: TaroFailureLike, cancelled: boolean): ApiError {
  if (cancelled || error.errMsg.includes('abort')) {
    return new ApiError('cancelled', 'The request was cancelled.');
  }
  if (error.errMsg.includes('timeout')) {
    return new ApiError('timeout', 'The request timed out.');
  }
  return new ApiError('network', 'The request could not be completed.');
}

export function createTaroTransport(requestImpl: TaroRequestLike): HttpTransport {
  return {
    request: <TData>(request: HttpRequest): Promise<HttpResponse<TData>> => {
      if (request.signal?.aborted) {
        return Promise.reject(new ApiError('cancelled', 'The request was cancelled.'));
      }

      return new Promise<HttpResponse<TData>>((resolve, reject) => {
        let settled = false;
        let task: TaroRequestTaskLike | undefined;

        const cleanup = () => request.signal?.removeEventListener('abort', onAbort);
        const rejectOnce = (error: ApiError) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(error);
        };
        const onAbort = () => {
          task?.abort();
          rejectOnce(new ApiError('cancelled', 'The request was cancelled.'));
        };

        request.signal?.addEventListener('abort', onAbort);

        try {
          const hasBody = request.body !== undefined;
          task = requestImpl({
            url: request.url,
            method: request.method ?? 'GET',
            header: {
              Accept: 'application/json',
              ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
              ...request.headers,
            },
            data: request.body,
            timeout: request.timeoutMs ?? 10_000,
            success: (response) => {
              if (settled) return;
              settled = true;
              cleanup();
              resolve({
                status: response.statusCode,
                data: response.data as TData,
                headers: response.header,
              });
            },
            fail: (error) => rejectOnce(mapFailure(error, request.signal?.aborted ?? false)),
          });

          if (request.signal?.aborted && !settled) onAbort();
        } catch {
          rejectOnce(new ApiError('network', 'The request could not be completed.'));
        }
      });
    },
  };
}
