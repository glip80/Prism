import React from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore, defaultTheme } from '../../../stores/themeStore';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    if (theme.id === 'default-light') {
      setTheme({
        ...defaultTheme,
        id: 'default-dark',
        name: 'Dark Theme',
        colors: {
          primary: '#1890ff',
          secondary: '#52c41a',
          background: '#141414',
          surface: '#1f1f1f',
          text: '#ffffff',
          textMuted: '#a6a6a6',
          border: '#434343',
          success: '#52c41a',
          warning: '#faad14',
          error: '#f5222d',
          info: '#1890ff',
        }
      });
    } else {
      setTheme(defaultTheme);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-border transition-colors text-text border border-border"
      title="Toggle Theme"
    >
      <Palette size={16} />
      <span className="text-sm">Theme</span>
    </button>
  );
};

export default ThemeSwitcher;
