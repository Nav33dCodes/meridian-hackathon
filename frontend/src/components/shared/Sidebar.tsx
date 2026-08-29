'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Bot,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/agent', label: 'AI Agent', icon: Bot },
  { href: '/locations', label: 'Locations', icon: MapPin },
];

export function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "anticipate" }}
      className="h-screen sticky top-0 flex flex-col bg-elevated/80 backdrop-blur-xl border-r border-subtle z-50 overflow-visible"
    >
      <div className="flex items-center justify-between p-5 border-b border-subtle">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-tr from-accent to-accent-muted text-white shadow-sm overflow-hidden">
             <img src="/logo.png" alt="Meridian" className="w-full h-full object-cover" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="font-bold text-base tracking-tight text-primary">Meridian</p>
                <p className="text-xs text-tertiary font-medium">Bento UI</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-7 right-[-14px] w-7 h-7 bg-elevated border border-subtle rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-subtle transition-colors shadow-sm z-50 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex flex-col gap-2 p-3 flex-1 relative mt-4 overflow-x-hidden">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`relative flex items-center gap-3 p-3 rounded-xl transition-all ${active 
                ? 'bg-accent/10 text-accent font-semibold shadow-sm' 
                : 'text-secondary hover:text-primary hover:bg-subtle/50'
                }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className={`shrink-0 ${active ? 'text-accent' : 'text-tertiary'}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap text-sm"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" 
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 flex items-center justify-between border-t border-subtle bg-base/50 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 shrink-0 rounded-full bg-risk-low animate-pulse" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs font-medium text-tertiary whitespace-nowrap"
              >
                System Live
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </motion.aside>
  );
}
