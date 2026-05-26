import { createContext, useContext, useState } from 'react';
import { DARK_THEME, LIGHT_THEME } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('light'); // 기본값 라이트

  // 나중에 다른 테마 추가되면여기에 분기 추가 처리 가능!
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);