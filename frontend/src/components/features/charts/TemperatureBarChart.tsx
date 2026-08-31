'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid,
} from 'recharts';
import type { HeatReading } from '@/types';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-elevated px-3 py-2.5 rounded-xl shadow-token-md">
        <p className="font-semibold text-sm text-primary">{d.locationName}</p>
        <div className="mt-1 flex gap-3">
          <span className="text-xs text-secondary">{d.temperatureCelsius.toFixed(1)}°C</span>
          <span className="text-xs text-secondary">{d.humidityPercent?.toFixed(0)}% RH</span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Split out of the dashboard so Recharts is fetched only when the chart tab is
 * opened — it is the single largest dependency on that route and the default
 * tab is the map.
 */
export default function TemperatureBarChart({ data }: { data: HeatReading[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 45 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
        <XAxis dataKey="locationName" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} tickFormatter={v => v.length > 12 ? v.substring(0, 12) + '…' : v} />
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}°`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
        <Bar dataKey="temperatureCelsius" radius={[3, 3, 0, 0]} maxBarSize={28}>
          {data.map((e, i) => <Cell key={i} fill={e.riskColor || 'var(--accent)'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
