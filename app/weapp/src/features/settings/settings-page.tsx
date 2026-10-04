import { Text, View } from '@tarojs/components';
import Button from '@taroify/core/button';
import { PageShell } from '@/components/page-shell';
import { useTheme } from '@/providers/theme-provider';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <PageShell title="设置" description="主题选择保存在微信本地存储。">
      <View className="card stack">
        <Text className="card-title">当前主题：{theme === 'light' ? '浅色' : '深色'}</Text>
        <Button block color="primary" onClick={() => void toggleTheme()}>
          切换为{theme === 'light' ? '深色' : '浅色'}主题
        </Button>
      </View>
    </PageShell>
  );
}
