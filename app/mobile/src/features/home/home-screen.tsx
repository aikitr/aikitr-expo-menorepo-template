import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/screen';

function PlatformTile({
  abbreviation,
  title,
  description,
}: {
  readonly abbreviation: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-2xl bg-background p-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent">
        <Text className="text-sm font-bold text-background">{abbreviation}</Text>
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-xs font-semibold text-foreground">{title}</Text>
        <Text className="text-[10px] text-muted">{description}</Text>
      </View>
    </View>
  );
}

function MetricCard({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <View className="flex-1 gap-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-2xl font-bold text-accent">{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

function QuickLink({
  abbreviation,
  title,
  description,
  onPress,
}: {
  readonly abbreviation: string;
  readonly title: string;
  readonly description: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-1 flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4 active:opacity-70"
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-background">
        <Text className="text-sm font-bold text-accent">{abbreviation}</Text>
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted">{description}</Text>
      </View>
    </Pressable>
  );
}

function CapabilityRow({
  abbreviation,
  title,
  description,
}: {
  readonly abbreviation: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-background">
        <Text className="text-xs font-bold text-accent">{abbreviation}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs leading-5 text-muted">{description}</Text>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();

  return (
    <Screen
      title="开发工作台"
      description="一套工程，连接 Android、iOS 和微信小程序。"
      bottomNavigation
    >
      <View className="gap-5 rounded-3xl bg-foreground p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-green-400" />
            <Text className="text-xs font-semibold text-background/70">多端应用模板</Text>
          </View>
          <Text className="rounded-full bg-background px-3 py-1 text-[10px] font-semibold text-foreground">
            READY
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-2xl font-bold leading-8 text-background">
            一个项目，覆盖{'\n'}三端应用
          </Text>
          <Text className="text-sm leading-5 text-background/70">
            原生体验与小程序各自适配，类型、接口和设计语义保持共享。
          </Text>
        </View>

        <View className="flex-row gap-3">
          <PlatformTile abbreviation="EX" title="Android · iOS" description="Expo 原生应用" />
          <PlatformTile abbreviation="T" title="微信小程序" description="Taro · Taroify" />
        </View>
      </View>

      <View className="flex-row gap-3">
        <MetricCard value="3" label="个运行平台" />
        <MetricCard value="4" label="类基础页面" />
        <MetricCard value="3" label="个共享软件包" />
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-lg font-semibold text-foreground">快速开始</Text>
          <Text className="text-xs text-muted">选择一个入口</Text>
        </View>
        <View className="flex-row gap-3">
          <QuickLink
            abbreviation="↗"
            title="浏览示例"
            description="查看共享数据"
            onPress={() => router.navigate('/examples')}
          />
          <QuickLink
            abbreviation="◐"
            title="主题设置"
            description="浅色与深色"
            onPress={() => router.navigate('/settings')}
          />
        </View>
      </View>

      <View className="gap-4 rounded-3xl border border-border bg-surface p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">模板能力</Text>
          <Text className="text-xs font-semibold text-accent">3 项已就绪</Text>
        </View>
        <CapabilityRow
          abbreviation="TS"
          title="共享类型与校验"
          description="公共数据契约由纯 TypeScript 包提供。"
        />
        <View className="h-px bg-border" />
        <CapabilityRow
          abbreviation="API"
          title="统一请求与 Mock"
          description="可离线浏览示例，也能替换为平台请求适配器。"
        />
        <View className="h-px bg-border" />
        <CapabilityRow
          abbreviation="UI"
          title="主题持久化"
          description="两端共享主题语义，并使用各自的原生组件。"
        />
      </View>
    </Screen>
  );
}
