import { View, Text } from '@tarojs/components';
import Button from '@taroify/core/button';
import ConfigProvider from '@taroify/core/config-provider';
import { colorTokens } from '@repo/tokens';
import type { ReactNode } from 'react';
import { useTheme } from '@/providers/theme-provider';

interface PageShellProps {
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  const { theme, ready } = useTheme();
  const colors = colorTokens[theme];

  return (
    <ConfigProvider
      themeMode={theme}
      theme={{
        primaryColor: colors.primary,
        backgroundColor: colors.background,
        backgroundColor2: colors.surface,
        textColor: colors.text,
        textColor2: colors.muted,
        borderColor: colors.border,
        dangerColor: colors.danger,
      }}
    >
      <View className={`page-shell theme-${theme}`}>
        <View className="page-header">
          <Text className="page-title">{title}</Text>
          {description ? <Text className="page-description">{description}</Text> : null}
        </View>
        {ready ? <View className="page-content">{children}</View> : <LoadingState />}
      </View>
    </ConfigProvider>
  );
}

export function LoadingState() {
  return <Text className="state-message">正在加载…</Text>;
}

export function EmptyState() {
  return <Text className="state-message">暂无数据。</Text>;
}

export function ErrorState({ message, onRetry }: { readonly message: string; onRetry(): void }) {
  return (
    <View className="state-card">
      <Text className="state-error">{message}</Text>
      <Button color="primary" onClick={onRetry}>
        重试
      </Button>
    </View>
  );
}
