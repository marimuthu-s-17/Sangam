import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

const ThemeContext = createContext({
  themeMode: 'light', // 'light' | 'dark' | 'system'
  setThemeMode: () => {},
  resolvedThemeMode: 'light', // resolved 'light' | 'dark'
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('sangam_theme') || 'light';
  });

  const [resolvedThemeMode, setResolvedThemeMode] = useState('light');

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('sangam_theme', mode);
  };

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setResolvedThemeMode(mediaQuery.matches ? 'dark' : 'light');
      };
      // Set initial
      handleChange();
      // Listen for updates
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedThemeMode(themeMode);
    }
  }, [themeMode]);

  // Apply dark mode class to body element for global styling (e.g. radial-gradient background)
  useEffect(() => {
    if (resolvedThemeMode === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.style.backgroundColor = '#0E0E10';
      document.body.style.color = '#F4F4F5';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = '#F5F1EC';
      document.body.style.color = '#1A1A1A';
    }
  }, [resolvedThemeMode]);

  const themeObj = getTheme(resolvedThemeMode);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedThemeMode }}>
      <MuiThemeProvider theme={themeObj}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
export default ThemeContext;
