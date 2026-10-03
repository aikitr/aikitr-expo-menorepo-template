export const colorTokens = {
  light: {
    primary: '#2563EB',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    danger: '#DC2626',
  },
  dark: {
    primary: '#60A5FA',
    background: '#020617',
    surface: '#0F172A',
    text: '#F8FAFC',
    muted: '#94A3B8',
    border: '#1E293B',
    danger: '#F87171',
  },
} as const;

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export type ThemeMode = keyof typeof colorTokens;
