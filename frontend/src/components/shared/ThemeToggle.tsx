'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';

export function ThemeToggle({ dark = false }: { dark?: boolean }) {
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

  const toggleTheme = () => {
    // Temporarily add theme-transitioning class to html to enable transitions
    document.documentElement.classList.add('theme-transitioning');
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 200);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`w-9 h-9 p-0 flex items-center justify-center ${dark ? 'text-sidebar-muted hover:text-sidebar hover:bg-sidebar-active' : 'text-secondary hover:text-primary'}`}
      aria-label={`Current theme is ${resolvedTheme}. Click to switch.`}
      title="Toggle Theme"
    >
      <span className="sr-only">Toggle theme</span>
      {resolvedTheme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
    </Button>
  );
}
