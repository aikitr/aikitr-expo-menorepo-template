import baseConfig from '@repo/eslint-config';

export default [
  ...baseConfig,
  {
    files: ['babel.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'readonly' },
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
              group: ['expo*', 'react-native', 'heroui-native*', 'uniwind'],
              message: 'Expo dependencies belong to the mobile application.',
            },
          ],
        },
      ],
    },
  },
];
