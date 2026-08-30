import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center bg-accent-muted">
          <Activity className="w-5 h-5 text-accent animate-pulse" />
        </div>
        <p className="text-sm font-medium text-tertiary tracking-wide animate-pulse">Loading intelligence...</p>
      </div>
    </div>
  );
}
