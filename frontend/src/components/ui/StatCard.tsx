import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  tone?: 1 | 2 | 3 | 4;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string | number;
    label?: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, tone = 1, trend, className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-kpi-${tone} rounded-2xl p-5 transition-transform duration-150 hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className={`text-sm font-medium text-kpi-${tone} opacity-80`}>{title}</h3>
        {icon && <div className={`text-kpi-${tone} p-2 rounded-full bg-white/50`}>{icon}</div>}
      </div>

      <div className="flex items-baseline gap-3">
        <h2 className={`text-3xl leading-none font-bold text-kpi-${tone} tracking-tight`}>{value}</h2>
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-xs font-semibold mt-3">
          {trend.direction === 'up' && <TrendingUp size={13} className="text-risk-low" />}
          {trend.direction === 'down' && <TrendingDown size={13} className="text-risk-extreme" />}
          {trend.direction === 'neutral' && <Minus size={13} className={`text-kpi-${tone} opacity-60`} />}
          <span className={
            trend.direction === 'up' ? 'text-risk-low' :
            trend.direction === 'down' ? 'text-risk-extreme' : `text-kpi-${tone} opacity-70`
          }>
            {trend.value}
          </span>
          {trend.label && <span className={`text-kpi-${tone} opacity-60 font-normal ml-0.5`}>{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
