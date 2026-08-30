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
      icon: AlertTriangle,
      pulse: true
    },
    High: {
      color: 'text-risk-high',
      bg: 'bg-risk-high/10',
      icon: AlertCircle,
      pulse: false
    },
    Moderate: {
      color: 'text-risk-moderate',
      bg: 'bg-risk-moderate/10',
      icon: Info,
      pulse: false
    },
    Low: {
      color: 'text-risk-low',
      bg: 'bg-risk-low/10',
      icon: ShieldCheck,
      pulse: false
    },
    Unknown: {
      color: 'text-tertiary',
      bg: 'bg-subtle',
      icon: Info,
      pulse: false
    }
  };

  const { color, bg, icon: Icon, pulse } = config[level] || config.Unknown;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${className}`}>
      <div className="relative flex items-center justify-center">
        {pulse && <div className={`absolute inset-0 rounded-full ${bg.replace('/10', '/40')} animate-ping`} />}
        <Icon size={12} className={`relative z-10 ${color}`} />
      </div>
      <span className={`text-xs font-semibold tracking-wide uppercase ${color}`}>
        {level}
      </span>
    </div>
  );
}
