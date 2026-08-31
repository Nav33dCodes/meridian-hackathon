'use client';
import Link from 'next/link';
import Image from 'next/image';
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
import { useEffect, useRef, useState } from 'react';
import { ThermalToggle } from './ThermalToggle';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/agent', label: 'AI Agent', icon: Bot },
  { href: '/locations', label: 'Locations', icon: MapPin },
];

type IndicatorRect = { top: number; left: number; width: number; height: number };

export function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  // Measure the active nav item and slide a single indicator to it, so
  // switching routes (or collapsing) animates instead of just swapping colors.
  useEffect(() => {
    const activeEl = itemRefs.current[path];
    const navEl = navRef.current;
    if (!activeEl || !navEl) {
      setIndicator(null);
      return;
    }
    const navRect = navEl.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    setIndicator({
      top: itemRect.top - navRect.top,
      left: itemRect.left - navRect.left,
      width: itemRect.width,
      height: itemRect.height,
    });
  }, [path, collapsed]);

  return (
    <aside className={`h-screen sticky top-0 shrink-0 bg-elevated border-r border-subtle flex flex-col transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[80px]' : 'w-[248px]'}`}>
      {/* Logo */}
      <div className={`flex items-center shrink-0 h-[72px] border-b border-subtle overflow-hidden ${collapsed ? 'justify-center px-0' : 'px-5 gap-3'}`}>
        <Image src="/logo.png" alt="Meridian" width={34} height={34} className="shrink-0" priority />
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <p className="font-bold text-sm tracking-tight text-primary leading-tight">Meridian</p>
            <p className="text-[11px] text-tertiary leading-tight">Heat Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav ref={navRef} className={`relative flex flex-col flex-1 overflow-x-hidden overflow-y-auto p-3 gap-1`}>
        {indicator && (
          <div
            aria-hidden
            className="absolute bg-accent-muted rounded-xl transition-all duration-200 ease-out pointer-events-none"
            style={{ top: indicator.top, left: indicator.left, width: indicator.width, height: indicator.height }}
          />
        )}

        {!collapsed && (
          <p className="relative px-3 pt-1 pb-2 text-[10px] font-semibold text-tertiary uppercase tracking-widest">General</p>
        )}

        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              ref={(el) => { itemRefs.current[href] = el; }}
              className={`group relative z-10 flex items-center rounded-xl transition-colors duration-150 ${collapsed ? 'justify-center h-11 w-11 mx-auto' : 'gap-3 px-3.5 h-11'} ${active
                ? 'text-accent font-semibold'
                : 'text-secondary hover:text-primary hover:bg-subtle font-medium'
                }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" strokeWidth={active ? 2.25 : 2} />
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
      <div className={`flex shrink-0 border-t border-subtle overflow-hidden ${collapsed ? 'flex-col items-center p-4 gap-3' : 'items-center justify-between gap-1 p-4'}`}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-subtle">
          <span className="live-dot shrink-0" />
          {!collapsed && (
            <span className="text-[11px] font-medium text-secondary whitespace-nowrap">Live</span>
          )}
        </div>
        <ThermalToggle collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          title="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
