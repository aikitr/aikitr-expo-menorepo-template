export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'http'
  | 'invalid-response'
  | 'cancelled';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, options: { status?: number } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
  }
}

export interface CancellationSignal {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}

export interface HttpRequest<TBody = unknown> {
  readonly url: string;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: TBody;
  readonly timeoutMs?: number;
  readonly signal?: CancellationSignal;
}

export interface HttpResponse<TData = unknown> {
  readonly status: number;
  readonly data: TData;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface HttpTransport {
  request<TData>(request: HttpRequest): Promise<HttpResponse<TData>>;
}

export interface StoragePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ExampleItem {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseExampleItem(value: unknown): ExampleItem {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.summary)
  ) {
    throw new ApiError('invalid-response', 'Example item is invalid.');
  }

  return {
    id: value.id,
    title: value.title,
    summary: value.summary,
  };
}

export function parseExampleItems(value: unknown): ExampleItem[] {
  if (!Array.isArray(value)) {
    throw new ApiError('invalid-response', 'Example collection is invalid.');
  }

  return value.map(parseExampleItem);
}
