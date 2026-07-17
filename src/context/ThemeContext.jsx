import { createContext, useContext, useEffect, useState } from "react";
import { themes } from "../themes/themes";

const ThemeContext = createContext();

const THEME_KEY = "fracture-theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);

    return savedTheme && themes[savedTheme] ? savedTheme : "midnight";
  });

  useEffect(() => {
    const root = document.documentElement;

    const colors = themes[theme].colors;

    root.style.setProperty("--bg-main", colors.bgMain);
    root.style.setProperty("--bg-secondary", colors.bgSecondary);

    root.style.setProperty("--surface", colors.surface);
    root.style.setProperty("--surface-hover", colors.surfaceHover);

    root.style.setProperty("--border", colors.border);

    root.style.setProperty("--text", colors.text);
    root.style.setProperty("--text-secondary", colors.textSecondary);
    root.style.setProperty("--text-muted", colors.textMuted);

    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-hover", colors.accentHover);
    root.style.setProperty("--accent-light", colors.accentLight);

    // Save selected theme
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
