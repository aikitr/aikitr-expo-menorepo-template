import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Screen } from '@/components/screen';

export function HomeScreen() {
  const router = useRouter();

  return (
    <Screen
      title="多端应用模板"
      description="Expo 负责 Android 与 iOS，Taro 负责微信小程序，共享类型、接口与设计语义。"
    >
      <View className="gap-3 rounded-3xl bg-surface p-5">
        <Text className="text-xl font-semibold text-foreground">已包含的基础能力</Text>
        <Text className="leading-6 text-muted">
          路由、主题持久化、请求适配、统一错误和 Mock 数据。
        </Text>
      </View>
      <View className="gap-3">
        <Button onPress={() => router.push('/examples')}>
          <Button.Label>浏览示例</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => router.push('/settings')}>
          <Button.Label>主题设置</Button.Label>
        </Button>
      </View>
    </Screen>
  );
}
