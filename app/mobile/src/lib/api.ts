import { createApiClient, createMockTransport } from '@repo/api';
import { createFetchTransport } from '@/adapters/http';

const useMock = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

if (!useMock && baseUrl.length === 0) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required when EXPO_PUBLIC_USE_MOCK=false.');
}

export const apiClient = createApiClient({
  baseUrl,
  transport: useMock ? createMockTransport() : createFetchTransport(),
});
