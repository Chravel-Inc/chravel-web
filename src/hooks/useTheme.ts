import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first (safely)
    let stored = null;
    try {
      stored = localStorage.getItem('theme');
    } catch {
      // ignore
    }
    if (stored) {
      return stored === 'dark';
    }
    // Default to dark mode (as the app is dark-first)
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      // Tailwind v3 class-based dark mode requires `dark` on an ancestor (`tailwind.config.ts`).
      // Light mode is driven by `html.light` + CSS variable overrides in `index.css`.
      root.classList.remove('light');
      root.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch {
        /* ignore */
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      try {
        localStorage.setItem('theme', 'light');
      } catch {
        /* ignore */
      }
    }
  }, [isDarkMode]);

  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  return { isDarkMode, toggleTheme };
}
