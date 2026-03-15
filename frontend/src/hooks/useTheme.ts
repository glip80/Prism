import { useState, useEffect, useCallback } from 'react';

type Theme = 'default-light' | 'default-dark';

const STORAGE_KEY = 'dashboard-theme';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'default-dark' || stored === 'default-light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'default-dark'
      : 'default-light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme === 'default-dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'default-light' ? 'default-dark' : 'default-light'));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return { theme, toggleTheme, setTheme, isDark: theme === 'default-dark' };
};
