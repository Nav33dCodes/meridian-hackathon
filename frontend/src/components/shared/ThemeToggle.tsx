'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';
import { Button } from './ui/Button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration guard: wait until mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a fixed-size placeholder to prevent layout shift during hydration
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  const cycleTheme = () => {
    // Temporarily add theme-transitioning class to html to enable transitions
    document.documentElement.classList.add('theme-transitioning');
    
    // Cycle logic based on resolvedTheme
    if (resolvedTheme === 'light') {
      setTheme('dark');
    } else if (resolvedTheme === 'dark') {
      setTheme('oled');
    } else {
      setTheme('light');
    }

    // Remove the class after the transition duration (150ms + small buffer)
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 200);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-9 h-9 p-0 flex items-center justify-center text-secondary hover:text-primary"
      aria-label={`Current theme is ${resolvedTheme}. Click to cycle.`}
      title="Toggle Theme"
    >
      <span className="sr-only">Toggle theme</span>
      {resolvedTheme === 'light' && <Sun size={18} />}
      {resolvedTheme === 'dark' && <Moon size={18} />}
      {resolvedTheme === 'oled' && <Contrast size={18} />}
    </Button>
  );
}
