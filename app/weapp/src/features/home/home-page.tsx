import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import Button from '@taroify/core/button';
import { PageShell } from '@/components/page-shell';

export function HomePage() {
  return (
    <PageShell
      title="多端应用模板"
      description="Expo 负责 Android 与 iOS，Taro 负责微信小程序，共享类型、接口与设计语义。"
    >
      <View className="card stack">
        <Text className="card-title">已包含的基础能力</Text>
        <Text className="body-text">路由、主题持久化、请求适配、统一错误和 Mock 数据。</Text>
      </View>
      <View className="stack">
        <Button
          block
          color="primary"
          onClick={() => void Taro.navigateTo({ url: '/pages/examples/index' })}
        >
          浏览示例
        </Button>
        <Button
          block
          variant="outlined"
          onClick={() => void Taro.switchTab({ url: '/pages/settings/index' })}
        >
          主题设置
        </Button>
      </View>
    </PageShell>
  );
}
