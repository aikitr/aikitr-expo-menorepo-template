import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ExampleItem } from '@repo/core';
import { ApiError } from '@repo/core';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-view';
import { Screen } from '@/components/screen';
import { apiClient } from '@/lib/api';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly items: ExampleItem[] }
  | { readonly status: 'error'; readonly message: string };

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return '发生未知错误。';
  if (error.kind === 'timeout') return '请求超时，请稍后重试。';
  if (error.kind === 'network') return '网络不可用，请检查连接。';
  if (error.kind === 'cancelled') return '请求已取消。';
  return '服务返回了无法处理的数据。';
}

export function ExampleListScreen() {
  const router = useRouter();
  const [loadKey, setLoadKey] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const retry = useCallback(() => setLoadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void apiClient
      .listExamples({ signal: controller.signal })
      .then((items) => setState({ status: 'ready', items }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => controller.abort();
  }, [loadKey]);

  return (
    <Screen title="示例列表" description="数据来自共享 API 客户端，页面只负责呈现状态。">
      {state.status === 'loading' ? <LoadingState /> : null}
      {state.status === 'error' ? <ErrorState message={state.message} onRetry={retry} /> : null}
      {state.status === 'ready' && state.items.length === 0 ? <EmptyState /> : null}
      {state.status === 'ready' && state.items.length > 0 ? (
        <View className="gap-3">
          {state.items.map((item) => (
            <Pressable
              accessibilityRole="button"
              className="gap-2 rounded-2xl border border-border bg-surface p-5 active:opacity-70"
              key={item.id}
              onPress={() => router.push({ pathname: '/examples/[id]', params: { id: item.id } })}
            >
              <Text className="text-lg font-semibold text-foreground">{item.title}</Text>
              <Text className="leading-5 text-muted">{item.summary}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
