'use client';

import { Toaster } from 'sonner';
import { useAppStore } from '@/lib/store/useAppStore';

/** Toasts follow Thermal Vision; a light toast over an IR feed reads as a bug. */
export function AppToaster() {
  const thermal = useAppStore((s) => s.thermal);
  return <Toaster position="bottom-right" theme={thermal ? 'dark' : 'light'} />;
}
