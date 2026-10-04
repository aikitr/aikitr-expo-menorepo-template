import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeMode } from '@repo/tokens';
import { weappStorage } from '@/adapters/storage';

const THEME_STORAGE_KEY = 'settings.theme';

interface ThemeContextValue {
  readonly theme: ThemeMode;
  readonly ready: boolean;
  setTheme(theme: ThemeMode): Promise<void>;
  toggleTheme(): Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { readonly children?: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void weappStorage.get(THEME_STORAGE_KEY).then((storedTheme) => {
      if (!active) return;
      setThemeState(storedTheme === 'dark' ? 'dark' : 'light');
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback(async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    try {
      await weappStorage.set(THEME_STORAGE_KEY, nextTheme);
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

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}
