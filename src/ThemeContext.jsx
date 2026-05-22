import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from './theme';

export const ThemeContext = createContext(THEMES.classic);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem('esc_theme') || 'classic'; }
    catch { return 'classic'; }
  });

  const theme = THEMES[themeId] || THEMES.classic;

  const toggle = () => {
    const next = themeId === 'classic' ? 'junior' : 'classic';
    setThemeId(next);
    try { localStorage.setItem('esc_theme', next); } catch {}
  };

  // Sync background color on <body> so there's no white flash outside the app root
  useEffect(() => {
    document.body.style.background = theme.bgApp;
  }, [theme.bgApp]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};