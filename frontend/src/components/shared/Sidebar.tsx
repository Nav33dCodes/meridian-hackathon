'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Bot,
  MapPin,
  Thermometer,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/agent', label: 'AI Agent', icon: Bot },
  { href: '/locations', label: 'Locations', icon: MapPin },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-[240px] h-screen sticky top-0 flex flex-col px-4 py-6 bg-base border-r border-subtle z-50">
      {/* Logo */}
      <div className="px-2 pb-6 mb-6 border-b border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent overflow-hidden">
            <img src="/logo.png" alt="Meridian" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-[15px] tracking-tight text-primary">Meridian</p>
            <p className="text-[11px] text-tertiary font-mono font-medium opacity-80">v1.0 · Heat AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 relative">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active 
                ? 'bg-subtle text-primary shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/5' 
                : 'text-secondary hover:text-primary hover:bg-subtle/50 border border-transparent'
                }`}
            >
              <Icon size={18} className={active ? 'text-accent' : 'text-tertiary'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 flex items-center justify-between px-2 border-t border-subtle">
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-[11px] font-medium text-tertiary">Live</span>
        </div>
      </div>
    </aside>
  );
}
