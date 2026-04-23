/**
 * ThemeContext — provides dark/light mode toggle across the app.
 *
 * Usage: wrap app in <ThemeProvider>, consume with useTheme().
 * If used outside a provider (e.g. during hot-reload), returns safe defaults.
 */
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('wordshelf-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('wordshelf-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('wordshelf-theme', 'light');
    }
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Safe fallback if used outside provider (e.g. during HMR)
  if (!ctx) {
    return {
      dark: document.documentElement.classList.contains('dark'),
      toggle: () => {
        const isDark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('wordshelf-theme', isDark ? 'dark' : 'light'); } catch {}
      },
    };
  }
  return ctx;
}
