'use client';

import React from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { ThemeMode } from '@/types/database';
import { Sun, Moon, Sparkles, Monitor } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { id: 'night', label: 'Night', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div
      role="group"
      aria-label="Theme mode switcher"
      className="inline-flex items-center p-1 rounded-lg bg-secondary/80 border border-border"
    >
      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            title={`Switch to ${t.label} mode`}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              isActive
                ? 'bg-card text-foreground shadow-sm font-semibold border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
