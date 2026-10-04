import baseConfig from '@repo/eslint-config';

export default [
  ...baseConfig,
  {
    files: ['metro.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/packages/*/src/**', '@repo/*/src/**'],
              message: 'Import workspace packages through their public exports.',
            },
            {
              group: ['@tarojs/*', '@taroify/*'],
              message: 'Taro dependencies belong to the WeChat application.',
            },
          ],
        },
      ],
    },
  },
];
