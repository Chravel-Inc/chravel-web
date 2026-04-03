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
      root.classList.remove('light');
      try { localStorage.setItem('theme', 'dark'); } catch { /* ignore */ }
    } else {
      root.classList.add('light');
      try { localStorage.setItem('theme', 'light'); } catch { /* ignore */ }
    }
  }, [isDarkMode]);

  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  return { isDarkMode, toggleTheme };
}
