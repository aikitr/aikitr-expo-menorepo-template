import { defineConfig, type UserConfigExport } from '@tarojs/cli';
import path from 'node:path';
import devConfig from './dev';
import prodConfig from './prod';

export default defineConfig<'webpack5'>(async (merge, { command }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'aikitr-weapp',
    date: '2026-10-04',
    designWidth: 750,
    deviceRatio: {
      375: 2,
      640: 1.17,
      750: 1,
      828: 0.905,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: {
        enable: true,
        exclude: [
          '@taroify/core/button',
          '@taroify/core/button/style',
          '@taroify/core/config-provider',
        ],
      },
    },
    cache: { enable: true },
    env: {
      TARO_APP_API_BASE_URL: JSON.stringify(process.env.TARO_APP_API_BASE_URL ?? ''),
      TARO_APP_USE_MOCK: JSON.stringify(process.env.TARO_APP_USE_MOCK ?? 'true'),
    },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      miniCssExtractPluginOption: { ignoreOrder: true },
    },
  };

  return merge({}, baseConfig, command === 'build' ? prodConfig : devConfig);
});
