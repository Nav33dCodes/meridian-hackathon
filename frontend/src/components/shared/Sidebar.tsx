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
      className={`h-screen sticky top-0 flex flex-col bg-base border-r border-subtle z-50 transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[76px]' : 'w-[264px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-subtle shrink-0 h-[72px] overflow-hidden ${collapsed ? 'px-0 justify-center' : 'px-5'}`}>
        <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 shrink-0 relative rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-accent/20 blur-md" />
            <Image src="/logo.png" alt="Meridian Logo" width={20} height={20} className="relative object-contain" priority />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="font-semibold text-[15px] tracking-tight text-primary leading-tight">Meridian</p>
              <p className="text-[11px] text-tertiary font-medium leading-tight">Heat Intelligence</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex flex-col flex-1 overflow-x-hidden overflow-y-auto ${collapsed ? 'p-2 gap-1' : 'p-3 gap-0.5'}`}>
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-tertiary uppercase tracking-widest">Menu</p>
        )}
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`group relative flex items-center rounded-md transition-colors duration-150 ${collapsed ? 'justify-center h-11 w-11 mx-auto' : 'gap-3 px-3 py-2.5'} ${active
                ? 'bg-accent text-white font-medium'
                : 'text-secondary hover:text-primary hover:bg-subtle'
                }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-tertiary group-hover:text-primary'}`} />
              {!collapsed && (
                <span className="whitespace-nowrap text-sm">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`flex flex-col border-t border-subtle shrink-0 overflow-hidden ${collapsed ? 'p-2 gap-2' : 'p-3 gap-3'}`}>
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-subtle border border-subtle w-fit">
            <span className="live-dot" />
            <span className="text-[11px] font-medium text-secondary whitespace-nowrap">System Live</span>
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
