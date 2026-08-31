'use client';

import { Flame } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';

/** Discoverable control for Thermal Vision; the `T` shortcut does the same thing. */
export function ThermalToggle({ collapsed = false }: { collapsed?: boolean }) {
  const thermal = useAppStore((s) => s.thermal);
  const toggleThermal = useAppStore((s) => s.toggleThermal);

  return (
    <button
      type="button"
      onClick={toggleThermal}
      aria-pressed={thermal}
      title={thermal ? 'Exit thermal vision (T)' : 'Thermal vision (T)'}
      className={`group flex items-center shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        collapsed ? 'justify-center w-9 h-9' : 'gap-2 px-3 h-9'
      } ${
        thermal
          ? 'bg-accent-muted text-accent'
          : 'text-secondary hover:text-primary hover:bg-subtle'
      }`}
    >
      <Flame size={15} className="shrink-0" strokeWidth={thermal ? 2.4 : 2} />
      {!collapsed && (
        <span className="text-[11px] font-semibold whitespace-nowrap tracking-wide">
          {thermal ? 'THERMAL' : 'Thermal'}
        </span>
      )}
    </button>
  );
}
