import { useCallback, useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import { ApiError, type ExampleItem } from '@repo/core';
import { EmptyState, ErrorState, LoadingState, PageShell } from '@/components/page-shell';
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

export function ExampleListPage() {
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
    <PageShell title="示例列表" description="数据来自共享 API 客户端，页面只负责呈现状态。">
      {state.status === 'loading' ? <LoadingState /> : null}
      {state.status === 'error' ? <ErrorState message={state.message} onRetry={retry} /> : null}
      {state.status === 'ready' && state.items.length === 0 ? <EmptyState /> : null}
      {state.status === 'ready' && state.items.length > 0 ? (
        <View className="stack">
          {state.items.map((item) => (
            <View
              className="card card-link stack"
              key={item.id}
              onClick={() =>
                void Taro.navigateTo({
                  url: `/pages/examples/detail?id=${encodeURIComponent(item.id)}`,
                })
              }
            >
              <Text className="card-title">{item.title}</Text>
              <Text className="body-text">{item.summary}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </PageShell>
  );
}
