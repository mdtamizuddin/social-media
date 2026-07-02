import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSecureItem, setSecureItem } from '../api/storage';
import { buildTheme, Theme, ThemeMode } from './tokens';

const STORAGE_KEY = 'theme-mode';

/**
 * The default mode is `dark`, matching the app's current look. Light mode is
 * fully supported by the tokens and ships from day one — flip it via
 * `toggleMode()` / `setMode()`. As screens migrate onto `useTheme()` they
 * become theme-reactive automatically; screens still on the legacy static
 * `Colors` object stay dark until migrated.
 */
const DEFAULT_MODE: ThemeMode = 'dark';

interface ThemeContextValue extends Theme {
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  // Restore the persisted preference on mount.
  useEffect(() => {
    let active = true;
    getSecureItem(STORAGE_KEY).then((stored) => {
      if (active && (stored === 'light' || stored === 'dark')) {
        setModeState(stored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void setSecureItem(STORAGE_KEY, next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      void setSecureItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...buildTheme(mode), toggleMode, setMode }),
    [mode, toggleMode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

/**
 * Build a memoized StyleSheet from the theme. Call inside a component:
 *
 *   const styles = useThemedStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
