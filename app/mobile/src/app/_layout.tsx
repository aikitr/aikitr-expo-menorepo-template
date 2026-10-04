import '../global.css';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';

function Navigation() {
  const { ready, theme } = useTheme();
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme === 'dark' ? '#020617' : '#F8FAFC' },
          headerTintColor: theme === 'dark' ? '#F8FAFC' : '#0F172A',
        }}
      >
        <Stack.Screen name="index" options={{ title: '首页' }} />
        <Stack.Screen name="examples/index" options={{ title: '示例' }} />
        <Stack.Screen name="examples/[id]" options={{ title: '示例详情' }} />
        <Stack.Screen name="settings" options={{ title: '设置' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <ThemeProvider>
          <Navigation />
        </ThemeProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
