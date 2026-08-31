'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated rounded-xl px-3.5 py-2.5 shadow-token-md text-sm">
      <p className="text-secondary mb-1">{label}</p>
      <p className="font-mono font-semibold text-base text-risk-moderate">
        {payload[0]?.value?.toFixed(1)}°C
      </p>
    </div>
  );
};

/** Split out so Recharts loads only once a location with trend data is selected. */
export default function TrendLineChart({
  data,
  color,
}: {
  data: { time: string; temp: number }[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} dx={-10} unit="°" />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Line type="monotone" dataKey="temp" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
