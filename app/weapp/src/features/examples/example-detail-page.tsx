import { useEffect, useState } from 'react';
import { Text, View } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import type { ExampleItem } from '@repo/core';
import { ErrorState, LoadingState, PageShell } from '@/components/page-shell';
import { apiClient } from '@/lib/api';

type DetailState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly item: ExampleItem }
  | { readonly status: 'error'; readonly message: string };

export function ExampleDetailPage() {
  const router = useRouter();
  const id = router.params.id;
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
    <PageShell title="示例详情">
      {state.status === 'loading' ? <LoadingState /> : null}
      {state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={() => setLoadKey((value) => value + 1)} />
      ) : null}
      {state.status === 'ready' ? (
        <View className="card stack">
          <Text className="detail-title">{state.item.title}</Text>
          <Text className="body-text">{state.item.summary}</Text>
        </View>
      ) : null}
    </PageShell>
  );
}
