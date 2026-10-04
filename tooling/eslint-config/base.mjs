import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export const baseConfig = tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', '.expo/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/packages/*/src/**', '@repo/*/src/**'],
              message: 'Import workspace packages through their public exports.',
            },
          ],
        },
      ],
    },
  },
);

export const platformAgnosticConfig = {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              'react',
              'react/*',
              'react-native',
              'react-native/*',
              'expo',
              'expo-*',
              'expo/*',
              '@tarojs/*',
              '@taroify/*',
              'heroui-native*',
              'uniwind',
              'node:*',
            ],
            message: 'Shared runtime packages must remain platform agnostic.',
          },
          {
            group: ['**/app/*/src/**', '**/packages/*/src/**', '@repo/*/src/**'],
            message: 'Import workspace packages through their public exports.',
          },
        ],
      },
    ],
  },
};

export default baseConfig;
