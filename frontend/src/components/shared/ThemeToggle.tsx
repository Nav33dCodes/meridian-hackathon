'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';

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
    <button
      onClick={cycleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-subtle text-secondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
      aria-label={`Current theme is ${resolvedTheme}. Click to cycle.`}
      title="Toggle Theme"
    >
      <span className="sr-only">Toggle theme</span>
      {resolvedTheme === 'light' && <Sun size={18} />}
      {resolvedTheme === 'dark' && <Moon size={18} />}
      {resolvedTheme === 'oled' && <Contrast size={18} />}
    </button>
  );
}
