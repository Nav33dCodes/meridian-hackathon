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
  Thermometer,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';

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
    <aside 
      className={`h-screen sticky top-0 flex flex-col bg-elevated/80 backdrop-blur-xl border-r border-subtle z-50 transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[80px]' : 'w-[260px]'}`}
    >
      <div className="flex items-center p-5 border-b border-subtle shrink-0 h-[81px] overflow-hidden">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-accent text-white shadow-token-md">
             <Thermometer size={22} className="drop-shadow-md" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="font-bold text-base tracking-tight text-primary">Meridian</p>
              <p className="text-xs text-tertiary font-medium">Bento UI</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-2 p-3 flex-1 overflow-x-hidden overflow-y-auto">
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
              {!collapsed && (
                <span className="whitespace-nowrap text-sm">
                  {label}
                </span>
              )}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 flex flex-col gap-3 border-t border-subtle bg-base/50 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 shrink-0 rounded-full bg-risk-low" />
            {!collapsed && <span className="text-xs font-medium text-tertiary whitespace-nowrap">System Live</span>}
          </div>
        </div>
        <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-3' : 'justify-between'}`}>
          <ThemeToggle />
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-tertiary hover:bg-subtle hover:text-primary transition-colors focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
