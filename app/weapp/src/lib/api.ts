import { createApiClient, createMockTransport } from '@repo/api';
import { createTaroTransport } from '@/adapters/http';
import { taroRequest } from '@/adapters/taro-request';

const useMock = process.env.TARO_APP_USE_MOCK !== 'false';
const baseUrl = process.env.TARO_APP_API_BASE_URL?.trim() ?? '';

if (!useMock && baseUrl.length === 0) {
  throw new Error('TARO_APP_API_BASE_URL is required when TARO_APP_USE_MOCK=false.');
}

export const apiClient = createApiClient({
  baseUrl,
  transport: useMock ? createMockTransport() : createTaroTransport(taroRequest),
});
