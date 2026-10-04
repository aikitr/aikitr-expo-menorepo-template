import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { colorTokens, type ThemeMode } from '@repo/tokens';
import {
  getGlassTabBarLayout,
  getGlassTabIndicatorOffset,
} from '@/components/glass-tab-bar-layout';

type TabIconName = 'home' | 'examples' | 'settings';

export function TabIcon({
  name,
  color,
  focused,
}: {
  readonly name: TabIconName;
  readonly color: string;
  readonly focused: boolean;
}) {
  const strokeWidth = focused ? 2.25 : 1.8;

  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      {name === 'home' ? (
        <Path
          d="m3.5 10.5 8.5-7 8.5 7M5.5 9v10.5h13V9M9.5 19.5v-6h5v6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {name === 'examples' ? (
        <>
          <Circle cx="5" cy="6" r="1" fill={color} />
          <Circle cx="5" cy="12" r="1" fill={color} />
          <Circle cx="5" cy="18" r="1" fill={color} />
          <Path
            d="M9 6h10M9 12h10M9 18h10"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      ) : null}
      {name === 'settings' ? (
        <>
          <Path
            d="M4 6h16M4 12h16M4 18h16"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle
            cx="9"
            cy="6"
            r="2"
            fill={focused ? color : 'transparent'}
            stroke={color}
            strokeWidth="1.5"
          />
          <Circle
            cx="15"
            cy="12"
            r="2"
            fill={focused ? color : 'transparent'}
            stroke={color}
            strokeWidth="1.5"
          />
          <Circle
            cx="8"
            cy="18"
            r="2"
            fill={focused ? color : 'transparent'}
            stroke={color}
            strokeWidth="1.5"
          />
        </>
      ) : null}
    </Svg>
  );
}

function GlassBackground({
  theme,
  capsuleTop,
  capsuleBottom,
}: {
  readonly theme: ThemeMode;
  readonly capsuleTop: number;
  readonly capsuleBottom: number;
}) {
  const dark = theme === 'dark';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.glassCapsule,
          {
            top: capsuleTop,
            bottom: capsuleBottom,
            backgroundColor: dark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.46)',
            borderColor: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.72)',
          },
        ]}
      >
        <BlurView
          intensity={70}
          tint={dark ? 'dark' : 'light'}
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(2, 6, 23, 0.26)' : 'rgba(255, 255, 255, 0.18)' },
          ]}
        />
      </View>
    </View>
  );
}

export function GlassTabBar({
  state,
  descriptors,
  navigation,
  insets,
  theme,
}: BottomTabBarProps & { readonly theme: ThemeMode }) {
  const [barWidth, setBarWidth] = useState(0);
  const previousIndex = useRef(state.index);
  const sliderX = useSharedValue(0);
  const sliderScale = useSharedValue(1);
  const firstRipple = useSharedValue(1);
  const secondRipple = useSharedValue(1);
  const palette = colorTokens[theme];
  const layout = getGlassTabBarLayout(insets.bottom);
  const itemWidth = barWidth / state.routes.length;

  const measureBar = useCallback((width: number) => setBarWidth(width), []);

  useEffect(() => {
    if (itemWidth <= 0) return;

    sliderX.value = withSpring(
      getGlassTabIndicatorOffset(state.index, barWidth, state.routes.length),
      { damping: 16, stiffness: 190, mass: 0.72 },
    );

    if (previousIndex.current !== state.index) {
      sliderScale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 250 }),
        withSpring(1, { damping: 12, stiffness: 170 }),
      );
      firstRipple.value = 0;
      secondRipple.value = 0;
      firstRipple.value = withTiming(1, { duration: 480 });
      secondRipple.value = withDelay(90, withTiming(1, { duration: 560 }));
    }

    previousIndex.current = state.index;
  }, [
    barWidth,
    firstRipple,
    itemWidth,
    secondRipple,
    sliderScale,
    sliderX,
    state.index,
    state.routes.length,
  ]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value }, { scaleX: sliderScale.value }],
  }));
  const firstRippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(firstRipple.value, [0, 1], [0.34, 0]),
    transform: [{ scale: interpolate(firstRipple.value, [0, 1], [0.28, 1.55]) }],
  }));
  const secondRippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(secondRipple.value, [0, 1], [0.22, 0]),
    transform: [{ scale: interpolate(secondRipple.value, [0, 1], [0.22, 1.28]) }],
  }));

  return (
    <View
      onLayout={(event) => measureBar(event.nativeEvent.layout.width)}
      style={[styles.tabBar, { height: layout.barHeight, paddingBottom: insets.bottom }]}
    >
      <GlassBackground
        theme={theme}
        capsuleTop={layout.capsuleTop}
        capsuleBottom={layout.capsuleBottom}
      />

      <View
        pointerEvents="none"
        style={[styles.indicatorTrack, { top: layout.capsuleTop, bottom: layout.capsuleBottom }]}
      >
        <Animated.View style={[styles.indicator, { width: itemWidth }, sliderStyle]}>
          <View
            style={[
              styles.indicatorPill,
              {
                backgroundColor:
                  theme === 'dark' ? 'rgba(96, 165, 250, 0.17)' : 'rgba(37, 99, 235, 0.12)',
                borderColor:
                  theme === 'dark' ? 'rgba(147, 197, 253, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                shadowColor: palette.primary,
              },
            ]}
          />
          <Animated.View
            style={[styles.ripple, { borderColor: palette.primary }, firstRippleStyle]}
          />
          <Animated.View
            style={[styles.ripple, { borderColor: palette.primary }, secondRippleStyle]}
          />
        </Animated.View>
      </View>

      <View style={styles.items}>
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const options = descriptor.options;
          const color = focused ? palette.primary : palette.muted;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const icon = options.tabBarIcon?.({ focused, color, size: 23 });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected: focused }}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.tabItem}
            >
              {icon}
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 20,
  },
  glassCapsule: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 6,
  },
  indicatorTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorPill: {
    position: 'absolute',
    top: 4,
    right: 6,
    bottom: 4,
    left: 6,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 9,
  },
  ripple: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  items: {
    flex: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -1,
  },
});
