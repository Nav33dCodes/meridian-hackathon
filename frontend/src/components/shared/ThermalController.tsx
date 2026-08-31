'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { THERMAL_ATTRIBUTE, THERMAL_STORAGE_KEY } from '@/lib/thermal';

/**
 * Owns the side effects of Thermal Vision: reconciles the store with the stored
 * preference on mount, mirrors it onto <html> and localStorage, and binds the
 * `T` shortcut. Renders nothing.
 */
export function ThermalController() {
  const thermal = useAppStore((s) => s.thermal);
  const setThermal = useAppStore((s) => s.setThermal);
  const toggleThermal = useAppStore((s) => s.toggleThermal);

  // The pre-paint script in <head> has already applied the attribute; read it
  // back rather than localStorage so the two can never disagree.
  useEffect(() => {
    const active = document.documentElement.getAttribute(THERMAL_ATTRIBUTE) === 'on';
    if (active) setThermal(true);
  }, [setThermal]);

  useEffect(() => {
    const root = document.documentElement;
    if (thermal) root.setAttribute(THERMAL_ATTRIBUTE, 'on');
    else root.removeAttribute(THERMAL_ATTRIBUTE);

    try {
      localStorage.setItem(THERMAL_STORAGE_KEY, thermal ? '1' : '0');
    } catch {
      // Private mode or blocked storage — the mode still works for this session.
    }
  }, [thermal]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 't' && e.key !== 'T') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Never steal the key from a field the user is typing in.
      const el = e.target as HTMLElement | null;
      if (el) {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return;
      }

      e.preventDefault();
      toggleThermal();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleThermal]);

  return null;
}
