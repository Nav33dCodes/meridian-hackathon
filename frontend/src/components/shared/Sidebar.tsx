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
  Flame,
} from 'lucide-react';
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
    <div className={`h-screen sticky top-0 shrink-0 p-3 transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[88px]' : 'w-[260px]'}`}>
      <aside className="bg-sidebar rounded-3xl h-full flex flex-col overflow-hidden">
        {/* Logo */}
        <div className={`flex items-center shrink-0 h-[68px] overflow-hidden ${collapsed ? 'px-0 justify-center' : 'px-5'}`}>
          <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-8 h-8 shrink-0 rounded-lg bg-accent flex items-center justify-center">
              <Flame size={16} className="text-white" strokeWidth={2.25} />
            </div>
            {!collapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="font-bold text-sm tracking-tight text-sidebar leading-tight">Meridian</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className={`flex flex-col flex-1 overflow-x-hidden overflow-y-auto ${collapsed ? 'p-2.5 gap-1' : 'p-3 gap-1'}`}>
          {!collapsed && (
            <p className="px-3 pt-1 pb-2 text-[10px] font-semibold text-sidebar-muted uppercase tracking-widest">General</p>
          )}
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={`group relative flex items-center rounded-full transition-colors duration-150 ${collapsed ? 'justify-center h-11 w-11 mx-auto' : 'gap-3 px-4 py-2.5'} ${active
                  ? 'bg-sidebar-active text-sidebar font-semibold'
                  : 'text-sidebar-muted hover:text-sidebar font-medium'
                  }`}
                title={collapsed ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
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
        <div className={`flex flex-col border-t border-sidebar shrink-0 overflow-hidden ${collapsed ? 'p-2.5 gap-2' : 'p-3 gap-2.5'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-sidebar-active w-fit">
              <span className="live-dot" />
              <span className="text-[11px] font-medium text-sidebar whitespace-nowrap">System Live</span>
            </div>
          )}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <ThemeToggle dark />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={`flex items-center justify-center p-0 text-sidebar-muted hover:text-sidebar hover:bg-sidebar-active ${collapsed ? 'w-9 h-9' : 'w-8 h-8'}`}
              title="Toggle Sidebar"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
