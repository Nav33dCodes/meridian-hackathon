'use client';
import { useQuery } from '@tanstack/react-query';
import { heatApi } from '@/lib/api/heat';
import {
  Thermometer, AlertTriangle, MapPin, Activity, RefreshCw,
  Download, Plus, Globe, BarChart3, FileText, Loader2
} from 'lucide-react';
import type { HeatReading } from '@/types';
import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useSignalR } from '@/hooks/useSignalR';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api/client';
import { downloadExport, exportLabel, type ExportFormat } from '@/lib/api/export';

const DynamicMap = dynamic(() => import('@/components/Map'), { ssr: false });

// Recharts is the heaviest dependency on this route and the default tab is the
// map, so it is fetched only once the chart tab is actually opened.
const TemperatureBarChart = dynamic(
  () => import('@/components/features/charts/TemperatureBarChart'),
  { ssr: false, loading: () => <div className="w-full h-full shimmer rounded-xl" /> }
);

import { RiskBadge } from '@/components/ui/RiskBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { TimeLapseSlider } from '@/components/features/TimeLapseSlider';

export default function DashboardPage() {
  useSignalR();
  const [activeTab, setActiveTab] = useState<'map' | 'chart'>('map');
  const [sortKey, setSortKey] = useState<'temp' | 'risk' | 'name'>('temp');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const runExport = async (format: ExportFormat) => {
    if (exporting) return;
    setExporting(format);
    setIsExportOpen(false);
    const toastId = toast.loading(`Preparing ${exportLabel(format)}…`);
    try {
      const filename = await downloadExport(format);
      toast.success(`Downloaded ${filename}`, { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed', { id: toastId });
    } finally {
      setExporting(null);
    }
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: heatApi.getDashboard,
    // Real-time updates are now pushed via SignalR WebSocket in useSignalR!
  });

  const [isHistorical, setIsHistorical] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => heatApi.getHistory(24),
    enabled: isHistorical,
  });

  // Calculate playback bounds
  const minTime = historyData && historyData.length > 0 ? Math.min(...historyData.map((d: any) => new Date(d.measuredAt).getTime())) : 0;
  const maxTime = historyData && historyData.length > 0 ? Math.max(...historyData.map((d: any) => new Date(d.measuredAt).getTime())) : 0;

  // Setup default playback time
  useEffect(() => {
    if (isHistorical && maxTime > 0 && playbackTime === 0) {
      setPlaybackTime(minTime); // start from beginning
    }
  }, [isHistorical, maxTime, minTime, playbackTime]);

  // Playback loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && isHistorical && minTime > 0) {
      interval = setInterval(() => {
        setPlaybackTime(prev => {
          const next = prev + 1000 * 60 * 30; // Advance 30 mins per tick
          if (next >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return next;
        });
      }, 500); // Tick every 500ms
    }
    return () => clearInterval(interval);
  }, [isPlaying, isHistorical, minTime, maxTime]);

  // Get active readings for map
  const activeReadings = useMemo(() => {
    if (isHistorical && historyData) {
      // Find the closest reading for each location that is BEFORE or AT playbackTime
      const locationMap = new Map();

      // Sort history descending by time so we can easily find the latest reading before playbackTime
      const sortedHistory = [...historyData].sort((a: any, b: any) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());

      for (const reading of sortedHistory) {
        const time = new Date(reading.measuredAt).getTime();
        if (time <= playbackTime && !locationMap.has(reading.locationId)) {
          locationMap.set(reading.locationId, reading);
        }
      }
      return Array.from(locationMap.values());
    }
    return data?.latestReadings ?? [];
  }, [isHistorical, historyData, playbackTime, data]);

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

  // Virtualizer for the readings list
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedReadings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 55, // Approx height of each row
    overscan: 10,
  });

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-base">
      <div className="flex flex-col h-full w-full gap-4 p-5 overflow-hidden">

        {/* ─── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-primary leading-none tracking-tight">Heat Intelligence</h1>
            <p className="text-sm text-tertiary mt-2">Global hyperlocal monitoring, live</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Segmented Control for Live/History */}
            <div className="flex items-center p-1 bg-subtle rounded-full mr-1">
              <button
                onClick={() => setIsHistorical(false)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${!isHistorical ? 'bg-elevated text-primary shadow-token-sm' : 'text-tertiary hover:text-secondary'}`}
              >
                Live
              </button>
              <button
                onClick={() => setIsHistorical(true)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${isHistorical ? 'bg-elevated text-primary shadow-token-sm' : 'text-tertiary hover:text-secondary'}`}
              >
                24h History
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-subtle">
              <span className={`w-1.5 h-1.5 rounded-full ${!isHistorical ? 'bg-risk-low animate-pulse' : 'bg-secondary'}`} />
              <span className="text-xs font-medium text-secondary">{isHistorical ? 'Playback' : 'Live Sync'}</span>
            </div>
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExportOpen(!isExportOpen)}
                disabled={!hasData || exporting !== null}
              >
                {exporting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Download size={14} className="mr-2" />
                )}
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
              {isExportOpen && (
                <div className="absolute top-full right-0 mt-2 bg-elevated rounded-2xl shadow-token-md p-1.5 w-44 z-50">
                  <button
                    className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-subtle rounded-full text-primary transition-colors flex items-center disabled:opacity-50"
                    disabled={exporting !== null}
                    onClick={() => runExport('excel')}
                  >
                    <FileText size={14} className="mr-2 text-secondary" /> Excel workbook
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-subtle rounded-full text-primary transition-colors flex items-center mt-0.5 disabled:opacity-50"
                    disabled={exporting !== null}
                    onClick={() => runExport('pdf')}
                  >
                    <Download size={14} className="mr-2 text-secondary" /> PDF report
                  </button>
                </div>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => refetch()}
              disabled={isHistorical}
            >
              <RefreshCw size={14} className={`mr-2 ${isFetching && !isHistorical ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ─── Stat Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {isLoading ? (
            skeletonRows.slice(0, 4).map((_, i) => <div key={i} className="shimmer h-[112px] rounded-2xl" />)
          ) : (
            <>
              <StatCard tone={2} title="Monitored Zones" value={data?.totalLocations ?? 0} trend={{ direction: 'neutral', value: readings.length, label: 'live' }} icon={<MapPin size={20} />} />
              <StatCard tone={1} title="Global Avg Temp" value={`${(data?.globalAverageTemp ?? 0).toFixed(1)}°C`} trend={{ direction: 'up', value: '+1.2°', label: 'vs avg' }} icon={<Thermometer size={20} />} />
              <StatCard tone={3} title="Extreme Risk" value={data?.extremeRiskCount ?? 0} trend={{ direction: (data?.extremeRiskCount ?? 0) > 0 ? 'up' : 'neutral', value: (data?.extremeRiskCount ?? 0) > 0 ? '+Action req' : 'Stable' }} icon={<AlertTriangle size={20} />} />
              <StatCard tone={4} title="High Risk" value={data?.highRiskCount ?? 0} trend={{ direction: 'neutral', value: 'Monitor' }} icon={<Activity size={20} />} />
            </>
          )}
        </div>

        {/* ─── Main Content ─────────────────────────────────── */}
        {!isLoading && readings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-subtle flex items-center justify-center">
              <MapPin size={24} className="text-tertiary" />
            </div>
            <div className="text-center">
              <h2 className="text-base font-semibold text-primary mb-1">No Active Zones</h2>
              <p className="text-sm text-secondary max-w-xs">Import a CSV on the Locations page to start receiving live heat data.</p>
            </div>
            <Link href="/locations">
              <Button size="sm">
                <Plus size={14} className="mr-2" />
                Manage Locations
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex gap-4 overflow-hidden w-full relative">

            {/* Left: Data Table (55%) */}
            <div className="flex flex-col rounded-2xl bg-elevated shadow-token-md relative z-10 shrink-0 w-[55%] overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">Live Readings</span>
                  <span className="text-xs bg-subtle text-secondary px-2.5 py-0.5 rounded-full">{readings.length} zones</span>
                </div>
                <div className="flex items-center gap-1 bg-subtle rounded-full p-1">
                  {(['temp', 'risk', 'name'] as const).map(k => (
                    <button
                      key={k}
                      onClick={() => setSortKey(k)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${sortKey === k ? 'bg-elevated text-primary shadow-token-sm' : 'text-tertiary hover:text-secondary'}`}
                    >
                      {k === 'temp' ? '°C' : k === 'risk' ? 'Risk' : 'A-Z'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto" ref={parentRef}>
                {/* Virtualized List Header */}
                <div className="sticky top-0 z-10 bg-elevated border-b border-subtle flex items-center">
                  <div className="text-xs font-semibold text-tertiary uppercase tracking-wider py-2 px-4 flex-1 min-w-[120px]">Location</div>
                  <div className="text-xs font-semibold text-tertiary uppercase tracking-wider py-2 px-3 w-24 shrink-0">Temp</div>
                  <div className="text-xs font-semibold text-tertiary uppercase tracking-wider py-2 px-3 w-20 shrink-0 hidden xl:block">Humid</div>
                  <div className="text-xs font-semibold text-tertiary uppercase tracking-wider py-2 px-3 w-20 shrink-0 hidden xl:block">Idx</div>
                  <div className="text-xs font-semibold text-tertiary uppercase tracking-wider py-2 px-3 w-28 shrink-0">Risk</div>
                </div>

                {isLoading ? (
                  <div className="flex flex-col">
                    {skeletonRows.map((_, i) => (
                      <div key={i} className="flex border-b border-subtle/40 py-2.5 px-4 items-center">
                        <div className="shimmer h-3.5 w-36 rounded flex-1 mr-2" />
                        <div className="shimmer h-3.5 w-10 rounded w-24 shrink-0 mr-2" />
                        <div className="shimmer h-3.5 w-8 rounded w-20 shrink-0 hidden xl:block mr-2" />
                        <div className="shimmer h-3.5 w-10 rounded w-20 shrink-0 hidden xl:block mr-2" />
                        <div className="shimmer h-4 w-14 rounded-full w-28 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const r = sortedReadings[virtualRow.index];
                      return (
                        <div
                          key={r.id}
                          className="flex border-b border-subtle hover:bg-subtle/60 transition-colors absolute top-0 left-0 w-full items-center overflow-hidden"
                          style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                        >
                          <div className="py-2 px-4 flex-1 min-w-[120px]">
                            <p className="text-sm font-medium text-primary truncate max-w-[160px]">{r.locationName}</p>
                            <p className="text-xs text-tertiary truncate max-w-[160px]">{r.resolution}</p>
                          </div>
                          <div className="py-2 px-3 w-24 shrink-0">
                            <span className="text-base font-semibold font-mono text-[color:var(--dynamic-color)]" style={{ '--dynamic-color': r.riskColor } as React.CSSProperties}>{r.temperatureCelsius.toFixed(1)}°</span>
                          </div>
                          <div className="py-2 px-3 w-20 shrink-0 hidden xl:block">
                            <span className="text-xs text-secondary font-mono">{r.humidityPercent.toFixed(0)}%</span>
                          </div>
                          <div className="py-2 px-3 w-20 shrink-0 hidden xl:block">
                            <span className="text-xs text-secondary font-mono">{r.heatIndexCelsius.toFixed(1)}°</span>
                          </div>
                          <div className="py-2 px-3 w-28 shrink-0">
                            <RiskBadge level={r.riskLevel as any} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-subtle bg-subtle shrink-0">
                <p className="text-xs text-tertiary">FortyGuard API · 20m² · 2m AGL</p>
              </div>
            </div>

            {/* Right: Map + Chart tabs (45%) */}
            <div className="flex flex-col rounded-2xl bg-elevated shadow-token-md flex-1 min-w-0 relative z-0 overflow-hidden">
              <div className="px-3 py-2.5 shrink-0 flex items-center gap-1">
                {(['map', 'chart'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${activeTab === tab
                      ? 'bg-subtle text-primary'
                      : 'text-tertiary hover:text-secondary'
                      }`}
                  >
                    {tab === 'map' ? <><Globe size={14} /> Global Map</> : <><BarChart3 size={14} /> Top 20 Chart</>}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 relative">
                {activeTab === 'map' ? (
                  <div className="absolute inset-0">
                    {isLoading || (isHistorical && historyLoading) ? (
                      <div className="w-full h-full shimmer" />
                    ) : (
                      <>
                        <DynamicMap data={activeReadings} />
                        {isHistorical && (
                          <TimeLapseSlider
                            minTime={minTime}
                            maxTime={maxTime}
                            currentTime={playbackTime}
                            onChange={setPlaybackTime}
                            isPlaying={isPlaying}
                            onTogglePlay={() => setIsPlaying(!isPlaying)}
                          />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 p-4">
                    {isLoading ? <div className="w-full h-full shimmer rounded-xl" /> : (
                      <TemperatureBarChart data={chartData} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
