import { Tabs } from 'expo-router';
import { GlassTabBar, TabIcon } from '@/components/glass-tab-bar';
import { mobileTabRoutes } from '@/components/mobile-tab-routes';
import { useTheme } from '@/providers/theme-provider';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} theme={theme} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name={mobileTabRoutes.home.name}
        options={{
          title: mobileTabRoutes.home.label,
          tabBarAccessibilityLabel: mobileTabRoutes.home.label,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={mobileTabRoutes.home.icon} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name={mobileTabRoutes.examples.name}
        options={{
          title: mobileTabRoutes.examples.label,
          tabBarAccessibilityLabel: mobileTabRoutes.examples.label,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={mobileTabRoutes.examples.icon} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name={mobileTabRoutes.settings.name}
        options={{
          title: mobileTabRoutes.settings.label,
          tabBarAccessibilityLabel: mobileTabRoutes.settings.label,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={mobileTabRoutes.settings.icon} color={String(color)} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
