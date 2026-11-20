'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '@/types/database';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark' | 'night';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'night'>('light');

  // Compute resolved theme
  const getResolvedTheme = (selectedTheme: ThemeMode): 'light' | 'dark' | 'night' => {
    if (selectedTheme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    return selectedTheme;
  };

  const applyThemeToDOM = (activeResolved: 'light' | 'dark' | 'night') => {
    const root = document.documentElement;
    root.setAttribute('data-theme', activeResolved);
    root.style.colorScheme = activeResolved === 'light' ? 'light' : 'dark';

    if (activeResolved === 'light') {
      root.classList.remove('dark', 'night');
    } else if (activeResolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('night');
    } else if (activeResolved === 'night') {
      root.classList.add('dark', 'night');
    }
  };

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('yope-theme') as ThemeMode | null;
    const initialTheme: ThemeMode = saved && ['light', 'dark', 'night', 'system'].includes(saved)
      ? saved
      : 'system';

    setThemeState(initialTheme);
    const resolved = getResolvedTheme(initialTheme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);

    // Watch OS color-scheme changes if set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentStored = (localStorage.getItem('yope-theme') as ThemeMode) || 'system';
      if (currentStored === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyThemeToDOM(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('yope-theme', newTheme);
    const resolved = getResolvedTheme(newTheme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
