'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { analysisApi } from '@/lib/api/analysis';
import { locationApi } from '@/lib/api/heat';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
      borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: '13px'
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '15px', color: 'var(--risk-moderate)' }}>
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
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Data Analysis & Correlation
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Pearson correlation analysis · Heat trend detection · AI-powered insights
        </p>
      </div>

      {/* Location selector */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
          borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' 
        }}
      >
        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Select Location for Analysis
        </label>
        <select
          value={selectedLocationId}
          onChange={e => setSelectedLocationId(e.target.value)}
          style={{
            width: '100%', maxWidth: '360px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', fontSize: '14px', borderRadius: '8px', padding: '10px 14px',
            outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="">-- Select location --</option>
          {locations?.map((l: any) => (
            <option key={l.id} value={l.id}>{l.name} — {l.city}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Trend Chart */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
            borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="flex items-center gap-3">
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Temperature Trend</h2>
              {forecast && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent border border-accent/30 animate-pulse">
                  T+1 Forecast: {forecast}°C
                </span>
              )}
            </div>
            {trend && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', 
                borderRadius: '999px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' 
              }}>
                <TrendIcon size={14} color={trendColor} />
                <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', color: trendColor }}>
                  {trend.direction} ({trend.changeRate > 0 ? '+' : ''}{trend.changeRate}°C)
                </span>
              </div>
            )}
          </div>
          {trendLoading ? (
            <div className="shimmer" style={{ height: '200px', borderRadius: '8px' }} />
          ) : trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendChartData}>
                <XAxis dataKey="time" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-tertiary)" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} dx={-10} unit="°" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="temp" stroke={trendColor} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '13px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-subtle)', borderRadius: '8px' 
            }}>
              Select a location with data to view trend
            </div>
          )}
        </div>

        {/* AI Insight */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
            borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)' 
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>AI Insight</h2>
          {analysis ? (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Current', val: `${analysis.currentTemp.toFixed(1)}°C` },
                  { label: 'Average', val: `${analysis.averageTemp.toFixed(1)}°C` },
                  { label: 'Peak', val: `${analysis.peakTemp.toFixed(1)}°C` },
                ].map(({ label, val }) => (
                  <div 
                    key={label} 
                    style={{ 
                      flex: 1, backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', 
                      padding: '12px 14px', border: '1px solid var(--border-default)' 
                    }}
                  >
                    <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: 700, color: 'var(--risk-moderate)' }}>{val}</p>
                  </div>
                ))}
              </div>
              <p style={{ 
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, 
                backgroundColor: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' 
              }}>
                {analysis.aiInsight}
              </p>
            </div>
          ) : (
            <div style={{ 
              height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '13px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-subtle)', borderRadius: '8px' 
            }}>
              Select a location to get AI insights
            </div>
          )}
        </div>
      </div>

      {/* Correlations */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
          borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' 
        }}
      >
        <div style={{ padding: '20px 20px 12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Location Correlations (Pearson)</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Statistical heat pattern relationships between monitored zones</p>
        </div>
        
        <div style={{ 
          display: 'grid', gridTemplateColumns: '1fr 1fr 120px 1fr', padding: '10px 20px', gap: '12px', 
          borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)' 
        }}>
          {['Zone A', 'Zone B', 'Coefficient', 'Interpretation'].map(h => (
            <p key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</p>
          ))}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {corrLoading ? (
            <div style={{ padding: '24px' }}><div className="shimmer" style={{ height: '60px', borderRadius: '8px' }} /></div>
          ) : !correlations || correlations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              Waiting for sufficient data. The AI requires historical temperature readings from at least two different monitored zones to calculate Pearson correlation coefficients.
            </div>
          ) : (
            correlations.map((c: any, i: number) => (
              <div 
                key={i} style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr 120px 1fr', padding: '14px 20px', gap: '12px', alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.locationA}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.locationB}</p>
                <p style={{ 
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700,
                  color: Math.abs(c.coefficient) > 0.7 ? 'var(--risk-low)' : Math.abs(c.coefficient) > 0.4 ? 'var(--risk-moderate)' : 'var(--text-secondary)'
                }}>
                  {c.coefficient.toFixed(3)}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.interpretation}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
