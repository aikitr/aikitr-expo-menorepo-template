import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Screen } from '@/components/screen';
import { useTheme } from '@/providers/theme-provider';

export function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Screen title="设置" description="主题选择保存在设备本地。" bottomNavigation>
      <View className="gap-4 rounded-3xl bg-surface p-5">
        <Text className="text-lg text-foreground">
          当前主题：{theme === 'light' ? '浅色' : '深色'}
        </Text>
        <Button onPress={() => void toggleTheme()}>
          <Button.Label>切换为{theme === 'light' ? '深色' : '浅色'}主题</Button.Label>
        </Button>
      </View>
    </Screen>
  );
}
