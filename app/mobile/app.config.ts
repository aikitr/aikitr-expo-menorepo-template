import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Aikitr Mobile',
  slug: 'aikitr-mobile',
  version: '0.1.0',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  scheme: 'aikitr',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.aikitr.mobile',
  },
  android: {
    package: 'com.example.aikitr.mobile',
    predictiveBackGestureEnabled: true,
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    ['expo-build-properties', { ios: { enableSceneSupport: true } }],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
