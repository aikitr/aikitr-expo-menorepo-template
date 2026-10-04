import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGlassTabBarLayout } from '@/components/glass-tab-bar-layout';

const StyledSafeAreaView = withUniwind(SafeAreaView);

export function Screen({
  title,
  description,
  children,
  bottomNavigation = false,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly bottomNavigation?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const contentBottomPadding = bottomNavigation
    ? getGlassTabBarLayout(insets.bottom).contentBottomPadding
    : undefined;

  return (
    <StyledSafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 py-8"
        contentContainerStyle={
          contentBottomPadding ? { paddingBottom: contentBottomPadding } : undefined
        }
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">{title}</Text>
          {description ? (
            <Text className="text-base leading-6 text-muted">{description}</Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </StyledSafeAreaView>
  );
}
