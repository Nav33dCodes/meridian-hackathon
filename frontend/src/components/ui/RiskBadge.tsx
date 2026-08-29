'use client';
import { AlertTriangle, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export type RiskLevel = 'Extreme' | 'High' | 'Moderate' | 'Low' | 'Unknown';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  const config = {
    Extreme: {
      color: 'text-risk-extreme',
      bg: 'bg-risk-extreme/10',
      border: 'border-risk-extreme/30',
      icon: AlertTriangle,
      pulse: true
    },
    High: {
      color: 'text-risk-high',
      bg: 'bg-risk-high/10',
      border: 'border-risk-high/30',
      icon: AlertCircle,
      pulse: true
    },
    Moderate: {
      color: 'text-risk-moderate',
      bg: 'bg-risk-moderate/10',
      border: 'border-risk-moderate/30',
      icon: Info,
      pulse: false
    },
    Low: {
      color: 'text-risk-low',
      bg: 'bg-risk-low/10',
      border: 'border-risk-low/30',
      icon: ShieldCheck,
      pulse: false
    },
    Unknown: {
      color: 'text-tertiary',
      bg: 'bg-subtle',
      border: 'border-default',
      icon: Info,
      pulse: false
    }
  };

  const { color, bg, border, icon: Icon, pulse } = config[level] || config.Unknown;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bg} ${border} ${className} shadow-sm backdrop-blur-md`}>
      <div className="relative flex items-center justify-center">
        {pulse && <div className={`absolute inset-0 rounded-full ${bg.replace('/10', '/40')} animate-ping`} />}
        <Icon size={14} className={`relative z-10 ${color}`} />
      </div>
      <span className={`text-xs font-bold tracking-wide uppercase ${color}`}>
        {level}
      </span>
    </div>
  );
}
