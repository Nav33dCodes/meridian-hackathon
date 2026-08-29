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
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { Button } from '../ui/Button';

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
      className={`h-screen sticky top-0 flex flex-col bg-elevated/80 backdrop-blur-xl border-r border-subtle z-50 transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      <div className={`flex items-center border-b border-subtle shrink-0 h-[81px] overflow-hidden ${collapsed ? 'px-0 justify-center' : 'px-5'}`}>
        <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 shrink-0 relative flex items-center justify-center">
             <Image src="/logo.png" alt="Meridian Logo" fill className="object-contain" priority />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="font-bold text-base tracking-tight text-primary">Meridian</p>
              <p className="text-xs text-tertiary font-medium">Bento UI</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex flex-col gap-2 flex-1 overflow-x-hidden overflow-y-auto ${collapsed ? 'p-2' : 'p-3'}`}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`relative flex items-center rounded-xl transition-all ${collapsed ? 'justify-center h-12 w-12 mx-auto' : 'gap-3 p-3'} ${active
                ? 'bg-accent/10 text-accent font-semibold shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-subtle'
                }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className={`shrink-0 ${active ? 'text-accent' : 'text-tertiary'}`} />
              {!collapsed && (
                <span className="whitespace-nowrap text-sm">
                  {label}
                </span>
              )}
              {active && !collapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`flex flex-col border-t border-subtle bg-base/50 shrink-0 overflow-hidden ${collapsed ? 'p-2 gap-2' : 'p-4 gap-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 shrink-0 rounded-full bg-risk-low" />
            <span className="text-xs font-medium text-tertiary whitespace-nowrap">System Live</span>
          </div>
        )}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center justify-center p-0 ${collapsed ? 'w-10 h-10' : 'w-9 h-9'}`}
            title="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
