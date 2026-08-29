import React from 'react';

export function RiskBadge({ level, color }: { level: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-sm"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}
    >
      {level}
    </span>
  );
}
