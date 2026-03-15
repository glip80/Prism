import { create } from 'zustand';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
  spacing: {
    unit: number;
    scale: number[];
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const defaultTheme: Theme = {
  id: 'default-light',
  name: 'Light Theme',
  colors: {
    primary: '#1890ff',
    secondary: '#52c41a',
    background: '#f0f2f5',
    surface: '#ffffff',
    text: '#000000',
    textMuted: '#8c8c8c',
    border: '#d9d9d9',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px', '2xl': '24px' }
  },
  spacing: { unit: 8, scale: [0, 4, 8, 16, 24, 32, 48, 64] },
  shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)' },
  borderRadius: { sm: '2px', md: '4px', lg: '8px' }
};

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: defaultTheme,
  setTheme: (theme) => set({ theme })
}));

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--color-${cssKey}`, value as string);
  });
  root.style.setProperty('--font-family', theme.typography.fontFamily);
};
