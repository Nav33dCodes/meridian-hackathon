'use client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { heatApi } from '@/lib/api/heat';
import {
  Thermometer, AlertTriangle, MapPin, Activity, RefreshCw,
  Download, Plus, TrendingUp, Globe
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid
} from 'recharts';
import type { HeatReading } from '@/types';
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useSignalR } from '@/hooks/useSignalR';
import Link from 'next/link';

const DynamicMap = dynamic(() => import('@/components/Map'), { ssr: false });

import { RiskBadge } from '@/components/features/dashboard/RiskBadge';
import { StatCard } from '@/components/features/dashboard/StatCard';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-elevated/80 backdrop-blur-xl border border-subtle/60 px-3 py-2.5 rounded-xl shadow-2xl">
        <p className="font-semibold text-[12px] text-primary">{d.locationName}</p>
        <div className="mt-1 flex gap-3">
          <span className="text-[11px] text-secondary">{d.temperatureCelsius.toFixed(1)}°C</span>
          <span className="text-[11px] text-secondary">{d.humidityPercent?.toFixed(0)}% RH</span>
        </div>
      </div>
    );
  }
  return null;
};

function exportToCSV(readings: HeatReading[]) {
  const header = 'Location,Temp °C,Temp °F,Humidity %,Heat Index °C,Risk Level,Latitude,Longitude,Measured At';
  const rows = readings.map(r =>
    `"${r.locationName}",${r.temperatureCelsius.toFixed(2)},${r.temperatureFahrenheit.toFixed(2)},${r.humidityPercent.toFixed(1)},${r.heatIndexCelsius.toFixed(2)},${r.riskLevel},${r.latitude},${r.longitude},"${new Date(r.measuredAt).toISOString()}"`
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meridian_export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  useSignalR();
  const [activeTab, setActiveTab] = useState<'map' | 'chart'>('map');
  const [sortKey, setSortKey] = useState<'temp' | 'risk' | 'name'>('temp');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: heatApi.getDashboard,
    refetchInterval: 30000,
  });

  const readings = data?.latestReadings ?? [];

  const sortedReadings = useMemo(() => {
    const copy = [...readings];
    if (sortKey === 'temp') return copy.sort((a, b) => b.temperatureCelsius - a.temperatureCelsius);
    if (sortKey === 'risk') {
      const order: Record<string, number> = { Extreme: 0, High: 1, Moderate: 2, Low: 3 };
      return copy.sort((a, b) => (order[a.riskLevel] ?? 9) - (order[b.riskLevel] ?? 9));
    }
    return copy.sort((a, b) => a.locationName.localeCompare(b.locationName));
  }, [readings, sortKey]);

  const chartData = sortedReadings.slice(0, 20);
  const hasData = !isLoading && readings.length > 0;
  const skeletonRows = [...Array(8)];

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col relative">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-base">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[var(--accent)]/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--risk-high)]/5 blur-[100px]" />
      </div>
      
      <div className="relative z-10 flex flex-col h-full w-full bg-transparent">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-3 border-b border-subtle flex items-center justify-between shrink-0 bg-elevated">
        <div className="flex items-center gap-2.5">
          <Globe size={15} className="text-accent" />
          <div>
            <h1 className="text-[13px] font-bold text-primary leading-none">Meridian Dashboard</h1>
            <p className="text-[10px] text-tertiary mt-0.5">Global urban heat intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-subtle border border-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-secondary">Live · 30s</span>
          </div>
          <button
            onClick={() => hasData && exportToCSV(readings)}
            disabled={!hasData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-subtle border border-subtle text-secondary text-[11px] font-medium hover:bg-base hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            Export CSV
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-[11px] font-medium hover:opacity-90 transition-opacity"
            style={{ color: 'var(--bg-base)' }}
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* â”€â”€ Stat Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-3 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 border-b border-subtle">
        {isLoading ? (
          skeletonRows.slice(0, 4).map((_, i) => <div key={i} className="shimmer h-[88px] rounded-xl" />)
        ) : (
          <>
            <StatCard label="Monitored Zones" value={data?.totalLocations ?? 0} sub={`${readings.length} with live data`} icon={MapPin} color="var(--accent)" />
            <StatCard label="Global Avg Temp" value={`${(data?.globalAverageTemp ?? 0).toFixed(1)}°C`} sub="All active zones" icon={Thermometer} color="var(--risk-moderate)" />
            <StatCard label="Extreme Risk" value={data?.extremeRiskCount ?? 0} sub="Immediate action" icon={AlertTriangle} color="var(--risk-extreme)" />
            <StatCard label="High Risk" value={data?.highRiskCount ?? 0} sub="Monitor closely" icon={Activity} color="var(--risk-high)" />
          </>
        )}
      </div>

      {/* â”€â”€ Main Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!isLoading && readings.length === 0 ? (
        // ... empty state ...
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-subtle border border-subtle flex items-center justify-center">
            <MapPin size={24} className="text-tertiary" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-primary mb-1">No Active Zones</h2>
            <p className="text-sm text-secondary max-w-xs">Import a CSV on the Locations page to start receiving live heat data.</p>
          </div>
          <Link href="/locations" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-sm font-semibold hover:opacity-90 transition-opacity" style={{ color: 'var(--bg-base)' }}>
            <Plus size={13} />
            Manage Locations
          </Link>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-hidden w-full relative">

          {/* Left: Data Table (55%) */}
          <div className="flex flex-col border-r border-subtle bg-base relative z-10 shrink-0" style={{ width: '55%' }}>
            <div className="px-4 py-2 border-b border-subtle flex items-center justify-between shrink-0 bg-subtle">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">Live Readings</span>
                <span className="text-[10px] bg-base border border-subtle text-secondary px-2 py-0.5 rounded-full">{readings.length} zones</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-tertiary mr-1">Sort:</span>
                {(['temp', 'risk', 'name'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${sortKey === k ? 'bg-accent' : 'text-tertiary hover:text-secondary'
                      }`}
                    style={sortKey === k ? { color: 'var(--bg-base)' } : {}}
                  >
                    {k === 'temp' ? '°C' : k === 'risk' ? 'Risk' : 'A-Z'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-elevated border-b border-subtle">
                  <tr>
                    <th className="text-[10px] font-semibold text-tertiary uppercase tracking-wider py-2 px-4">Location</th>
                    <th className="text-[10px] font-semibold text-tertiary uppercase tracking-wider py-2 px-3">Temp</th>
                    <th className="text-[10px] font-semibold text-tertiary uppercase tracking-wider py-2 px-3 hidden xl:table-cell">Humidity</th>
                    <th className="text-[10px] font-semibold text-tertiary uppercase tracking-wider py-2 px-3 hidden xl:table-cell">Heat Idx</th>
                    <th className="text-[10px] font-semibold text-tertiary uppercase tracking-wider py-2 px-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    skeletonRows.map((_, i) => (
                      <tr key={i} className="border-b border-subtle/40">
                        <td className="py-2.5 px-4"><div className="shimmer h-3.5 w-36 rounded" /></td>
                        <td className="py-2.5 px-3"><div className="shimmer h-3.5 w-10 rounded" /></td>
                        <td className="py-2.5 px-3 hidden xl:table-cell"><div className="shimmer h-3.5 w-8 rounded" /></td>
                        <td className="py-2.5 px-3 hidden xl:table-cell"><div className="shimmer h-3.5 w-10 rounded" /></td>
                        <td className="py-2.5 px-3"><div className="shimmer h-4 w-14 rounded-md" /></td>
                      </tr>
                    ))
                  ) : (
                    sortedReadings.map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.01, 0.25) }}
                        className="border-b border-subtle/40 hover:bg-subtle/60 transition-colors"
                      >
                        <td className="py-2 px-4">
                          <p className="text-[12px] font-medium text-primary truncate max-w-[160px]">{r.locationName}</p>
                          <p className="text-[10px] text-tertiary">{r.resolution}</p>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[13px] font-bold font-mono" style={{ color: r.riskColor }}>{r.temperatureCelsius.toFixed(1)}°</span>
                        </td>
                        <td className="py-2 px-3 hidden xl:table-cell">
                          <span className="text-[11px] text-secondary font-mono">{r.humidityPercent.toFixed(0)}%</span>
                        </td>
                        <td className="py-2 px-3 hidden xl:table-cell">
                          <span className="text-[11px] text-secondary font-mono">{r.heatIndexCelsius.toFixed(1)}°</span>
                        </td>
                        <td className="py-2 px-3">
                          <RiskBadge level={r.riskLevel} color={r.riskColor} />
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2 border-t border-subtle bg-subtle shrink-0">
              <p className="text-[10px] text-tertiary">📡 FortyGuard API · 20m² · 2m AGL &nbsp;·&nbsp; 🤖 Groq llama-3.3-70b</p>
            </div>
          </div>

          {/* Right: Map + Chart tabs (45%) */}
          <div className="flex flex-col flex-1 min-w-0 bg-base relative z-0">
            <div className="px-3 py-2 border-b border-subtle bg-subtle shrink-0 flex items-center gap-1">
              {(['map', 'chart'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${activeTab === tab
                    ? 'bg-elevated border border-subtle text-primary shadow-sm'
                    : 'text-tertiary hover:text-secondary'
                    }`}
                >
                  {tab === 'map' ? '🌍 Global Map' : '📊 Top 20 Chart'}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === 'map' ? (
                  <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="absolute inset-0">
                    {isLoading ? <div className="w-full h-full shimmer" /> : <DynamicMap data={readings} />}
                  </motion.div>
                ) : (
                  <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="absolute inset-0 p-4">
                    {isLoading ? <div className="w-full h-full shimmer rounded-lg" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 45 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                          <XAxis dataKey="locationName" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} tickFormatter={v => v.length > 12 ? v.substring(0, 12) + '…' : v} />
                          <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}°`} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                          <Bar dataKey="temperatureCelsius" radius={[3, 3, 0, 0]} maxBarSize={28}>
                            {chartData.map((e, i) => <Cell key={i} fill={e.riskColor || 'var(--accent)'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
