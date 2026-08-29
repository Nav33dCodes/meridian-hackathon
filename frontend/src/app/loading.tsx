import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-base relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--accent)]/5 blur-[100px]" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/20 border border-accent/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
          <Activity className="w-6 h-6 text-accent animate-pulse" />
        </div>
        <p className="text-sm font-medium text-tertiary tracking-wide animate-pulse">Loading intelligence...</p>
      </div>
    </div>
  );
}
