import React, { useEffect } from 'react';
import { useThemeStore, applyTheme } from '../../stores/themeStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Inject a global style or class if needed, but CSS vars on root usually suffice.
  return <div className={`theme-${theme.id}`} style={{ width: '100%', height: '100%' }}>{children}</div>;
};
