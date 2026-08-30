import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string | number;
    label?: string;
  };
  delay?: number;
  className?: string;
}

export function StatCard({ title, value, icon, trend, delay = 0, className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-elevated border border-subtle rounded-lg p-6 hover:border-accent/50 transition-colors duration-150 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-secondary">{title}</h3>
        {icon && <div className="text-tertiary p-2 bg-subtle rounded-md border border-subtle">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-3">
        <h2 className="text-4xl font-semibold text-primary tracking-tight">{value}</h2>

        {trend && (
          <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-subtle border border-subtle">
            {trend.direction === 'up' && <TrendingUp size={14} className="text-risk-high" />}
            {trend.direction === 'down' && <TrendingDown size={14} className="text-risk-low" />}
            {trend.direction === 'neutral' && <Minus size={14} className="text-tertiary" />}
            <span className={
              trend.direction === 'up' ? 'text-risk-high' :
              trend.direction === 'down' ? 'text-risk-low' : 'text-tertiary'
            }>
              {trend.value}
            </span>
            {trend.label && <span className="text-tertiary font-normal ml-0.5">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
