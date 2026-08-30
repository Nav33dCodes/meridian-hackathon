'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { analysisApi } from '@/lib/api/analysis';
import { locationApi } from '@/lib/api/heat';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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

export default function AnalysisPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: locationApi.getAll });
  const { data: correlations, isLoading: corrLoading } = useQuery({
    queryKey: ['correlations'],
    queryFn: () => analysisApi.getCorrelations(),
  });
  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['trend', selectedLocationId],
    queryFn: () => analysisApi.getTrend(selectedLocationId),
    enabled: !!selectedLocationId,
  });
  const { data: analysis } = useQuery({
    queryKey: ['analysis', selectedLocationId],
    queryFn: () => analysisApi.analyzeLocation(selectedLocationId),
    enabled: !!selectedLocationId,
  });

  const trendChartData = trend?.dataPoints?.map((p: any) => ({
    time: format(new Date(p.timestamp), 'HH:mm'),
    temp: p.temperature,
  })) ?? [];

  const TrendIcon = trend?.direction === 'rising' || trend?.direction === 'spike'
    ? TrendingUp
    : trend?.direction === 'falling'
      ? TrendingDown
      : Minus;

  const trendColor = trend?.direction === 'rising' || trend?.direction === 'spike'
    ? 'var(--risk-high)'
    : trend?.direction === 'falling'
      ? 'var(--risk-low)'
      : 'var(--text-secondary)';

  const forecast = trend && trendChartData.length > 0
    ? (trendChartData[trendChartData.length - 1].temp + trend.changeRate).toFixed(1)
    : null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-accent-muted flex items-center justify-center">
          <BarChart3 size={18} className="text-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs text-tertiary mb-1 font-medium">
            <span>Dashboard</span>
            <span className="text-secondary">/</span>
            <span className="text-primary">Analysis</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-primary leading-none">
            Data Analysis
          </h1>
          <p className="text-sm text-secondary mt-1.5">
            Pearson correlation analysis · Heat trend detection · AI-powered insights
          </p>
        </div>
      </div>

      {/* Location selector */}
      <Card className="mb-6" padding="md">
        <label className="text-sm font-medium text-secondary block mb-2">
          Select Location for Analysis
        </label>
        <select
          value={selectedLocationId}
          onChange={e => setSelectedLocationId(e.target.value)}
          className="w-full max-w-[360px] bg-subtle text-primary text-sm rounded-full px-4 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-accent/50 transition-shadow"
        >
          <option value="">-- Select location --</option>
          {locations?.map((l: any) => (
            <option key={l.id} value={l.id}>{l.name} — {l.city}</option>
          ))}
        </select>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Trend Chart */}
        <Card padding="md">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-primary">Temperature Trend</h2>
              {forecast && (
                <Badge variant="outline" className="border-accent/30 text-accent bg-accent/10">
                  T+1 Forecast: {forecast}°C
                </Badge>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-subtle">
                <TrendIcon size={14} style={{ color: trendColor }} />
                <span className="text-xs font-semibold capitalize" style={{ color: trendColor }}>
                  {trend.direction} ({trend.changeRate > 0 ? '+' : ''}{trend.changeRate}°C)
                </span>
              </div>
            )}
          </div>
          {trendLoading ? (
            <div className="shimmer h-[200px] rounded-lg" />
          ) : trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendChartData}>
                <XAxis dataKey="time" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} dx={-10} unit="°" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="temp" stroke={trendColor} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-tertiary border border-dashed border-subtle rounded-xl">
              Select a location with data to view trend
            </div>
          )}
        </Card>

        {/* AI Insight */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-primary mb-5">AI Insight</h2>
          {analysis ? (
            <div>
              <div className="flex gap-4 mb-5">
                {[
                  { label: 'Current', val: `${analysis.currentTemp.toFixed(1)}°C` },
                  { label: 'Average', val: `${analysis.averageTemp.toFixed(1)}°C` },
                  { label: 'Peak', val: `${analysis.peakTemp.toFixed(1)}°C` },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex-1 bg-subtle rounded-xl px-3.5 py-3"
                  >
                    <p className="text-xs text-tertiary font-semibold uppercase tracking-widest mb-1">{label}</p>
                    <p className="font-mono text-lg font-bold text-risk-moderate">{val}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-secondary leading-relaxed bg-subtle p-4 rounded-xl">
                {analysis.aiInsight}
              </p>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-tertiary border border-dashed border-subtle rounded-xl">
              Select a location to get AI insights
            </div>
          )}
        </Card>
      </div>

      {/* Correlations */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-primary">Location Correlations (Pearson)</h2>
          <p className="text-xs text-secondary mt-1">Statistical heat pattern relationships between monitored zones</p>
        </div>

        <div className="grid grid-cols-[1fr_1fr_120px_1fr] px-5 py-2.5 gap-3 bg-subtle">
          {['Zone A', 'Zone B', 'Coefficient', 'Interpretation'].map(h => (
            <p key={h} className="text-xs font-semibold text-tertiary uppercase tracking-widest">{h}</p>
          ))}
        </div>

        <div className="flex flex-col max-h-[400px] overflow-y-auto">
          {corrLoading ? (
            <div className="p-6"><div className="shimmer h-[60px] rounded-xl" /></div>
          ) : !correlations || correlations.length === 0 ? (
            <div className="p-10 text-center text-tertiary text-sm">
              Waiting for sufficient data. The AI requires historical temperature readings from at least two different monitored zones to calculate Pearson correlation coefficients.
            </div>
          ) : (
            correlations.map((c: any, i: number) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_120px_1fr] px-5 py-3.5 gap-3 items-center border-b border-subtle last:border-b-0"
              >
                <p className="text-sm text-primary font-medium">{c.locationA}</p>
                <p className="text-sm text-primary font-medium">{c.locationB}</p>
                <p className={`font-mono text-sm font-bold ${Math.abs(c.coefficient) > 0.7 ? 'text-risk-low' : Math.abs(c.coefficient) > 0.4 ? 'text-risk-moderate' : 'text-secondary'}`}>
                  {c.coefficient.toFixed(3)}
                </p>
                <p className="text-xs text-secondary">{c.interpretation}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
