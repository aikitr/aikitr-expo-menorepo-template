import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';

export function LoadingState({ label = '正在加载…' }: { readonly label?: string }) {
  return (
    <View className="items-center gap-3 rounded-2xl bg-surface p-8">
      <ActivityIndicator />
      <Text className="text-muted">{label}</Text>
    </View>
  );
}

export function EmptyState() {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface p-6">
      <Text className="text-lg font-semibold text-foreground">暂无示例</Text>
      <Text className="text-muted">接口返回了空列表，页面已正确处理。</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { readonly message: string; onRetry(): void }) {
  return (
    <View className="gap-4 rounded-2xl border border-danger bg-surface p-6">
      <View className="gap-1">
        <Text className="text-lg font-semibold text-danger">加载失败</Text>
        <Text className="text-muted">{message}</Text>
      </View>
      <Button variant="danger-soft" onPress={onRetry}>
        <Button.Label>重试</Button.Label>
      </Button>
    </View>
  );
}
