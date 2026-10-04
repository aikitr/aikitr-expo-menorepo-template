import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { ExampleItem } from '@repo/core';
import { ErrorState, LoadingState } from '@/components/state-view';
import { Screen } from '@/components/screen';
import { apiClient } from '@/lib/api';

type DetailState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly item: ExampleItem }
  | { readonly status: 'error'; readonly message: string };

export function ExampleDetailScreen({ id }: { readonly id?: string }) {
  const [loadKey, setLoadKey] = useState(0);
  const [state, setState] = useState<DetailState>({ status: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ status: 'error', message: '缺少示例编号。' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    void apiClient
      .getExample(id, { signal: controller.signal })
      .then((item) => setState({ status: 'ready', item }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error', message: '无法加载该示例。' });
      });
    return () => controller.abort();
  }, [id, loadKey]);

  return (
    <Screen title="示例详情">
      {state.status === 'loading' ? <LoadingState /> : null}
      {state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={() => setLoadKey((value) => value + 1)} />
      ) : null}
      {state.status === 'ready' ? (
        <View className="gap-3 rounded-3xl bg-surface p-6">
          <Text className="text-2xl font-semibold text-foreground">{state.item.title}</Text>
          <Text className="text-base leading-6 text-muted">{state.item.summary}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
