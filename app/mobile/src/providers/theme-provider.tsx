import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeMode } from '@repo/tokens';
import { Uniwind } from 'uniwind';
import { mobileStorage } from '@/adapters/storage';

const THEME_STORAGE_KEY = 'settings.theme';

interface ThemeContextValue {
  readonly theme: ThemeMode;
  readonly ready: boolean;
  setTheme(theme: ThemeMode): Promise<void>;
  toggleTheme(): Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void mobileStorage
      .get(THEME_STORAGE_KEY)
      .then((storedTheme) => {
        if (!active) return;
        const nextTheme: ThemeMode = storedTheme === 'dark' ? 'dark' : 'light';
        setThemeState(nextTheme);
        Uniwind.setTheme(nextTheme);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback(async (nextTheme: ThemeMode) => {
    Uniwind.setTheme(nextTheme);
    setThemeState(nextTheme);
    try {
      await mobileStorage.set(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The selected theme remains active for this session if persistence is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === 'light' ? 'dark' : 'light'),
    [setTheme, theme],
  );

  const value = useMemo(
    () => ({ theme, ready, setTheme, toggleTheme }),
    [ready, setTheme, theme, toggleTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const value = use(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}
