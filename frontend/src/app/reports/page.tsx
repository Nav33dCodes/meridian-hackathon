'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { reportApi } from '@/lib/api/analysis';
import { FileText, Sparkles, Calendar, Loader2, Trash2, Download, AlertTriangle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Report } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const RISK_LEVELS = ['All', 'Extreme', 'High', 'Moderate', 'Low'] as const;
type RiskFilter = typeof RISK_LEVELS[number];

function getRiskVariant(risk: string): any {
  if (risk === 'Extreme') return 'error';
  if (risk === 'High') return 'warning';
  if (risk === 'Low') return 'success';
  return 'default';
}

function ConfirmModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading?: boolean; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <Card padding="md" className="relative w-full max-w-sm mx-4 z-10 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-risk-extreme/10 border border-risk-extreme/20 flex items-center justify-center mb-4">
          <AlertTriangle size={18} className="text-risk-extreme" />
        </div>
        <h3 className="text-base font-bold text-primary mb-1">Delete Report</h3>
        <p className="text-sm text-secondary mb-6">This report will be permanently removed. This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button 
            className="bg-risk-extreme text-white hover:opacity-90 border border-transparent" 
            size="sm" 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading && <Loader2 size={14} className="animate-spin mr-2" />}
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.getRecent(100),
  });

  const generate = useMutation({
    mutationFn: () => reportApi.generate(),
    onSuccess: () => { toast.success('Report generated!'); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteReport = useMutation({
    mutationFn: (id: string) => reportApi.delete(id),
    onSuccess: () => {
      toast.success('Report deleted');
      setDeleteConfirm(null);
      if (selected === deleteConfirm) setSelected(null);
      refetch();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const filtered = (reports ?? []).filter(r =>
    riskFilter === 'All' || r.overallRisk === riskFilter
  );

  const selectedReport = reports?.find(r => r.id === selected);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
  });

  const exportReport = (report: Report) => {
    const content = [
      `MERIDIAN HEAT RISK ADVISORY`,
      `===========================================================`,
      ``,
      `Title: ${report.title}`,
      `Generated: ${format(new Date(report.createdAt), 'MMMM dd, yyyy HH:mm')} UTC`,
      `Overall Risk: ${report.overallRisk}`,
      `Average Temp: ${report.averageTemperatureCelsius.toFixed(1)}°C`,
      `Peak Temp: ${report.peakTemperatureCelsius.toFixed(1)}°C`,
      `Model: ${report.modelUsed ?? 'N/A'}`,
      ``,
      `-----------------------------------------------------------`,
      ``,
      report.content,
      ``,
      `-----------------------------------------------------------`,
      `Meridian Urban Heat Intelligence Platform`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meridian_report_${report.id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-base">

      {/* ─── Header ───────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-subtle flex items-center justify-between shrink-0 bg-elevated">
        <div>
          <h1 className="text-sm font-bold text-primary leading-none">AI Risk Reports</h1>
          <p className="text-xs text-tertiary mt-1">Government-grade advisories · Meridian AI</p>
        </div>
        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          size="sm"
        >
          {generate.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
          Generate Report
        </Button>
      </div>

      {/* ─── Risk Filter Bar ────────────────────────────── */}
      <div className="px-6 py-3 border-b border-subtle shrink-0 bg-subtle flex items-center gap-2">
        <Filter size={14} className="text-tertiary mr-1" />
        <span className="text-xs text-tertiary font-semibold uppercase tracking-wider mr-2">Filter:</span>
        {RISK_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setRiskFilter(level)}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
              riskFilter === level
                ? 'bg-primary text-base'
                : 'bg-transparent text-secondary hover:text-primary hover:bg-elevated'
            }`}
          >
            {level}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-tertiary bg-elevated px-2 py-1 rounded-md border border-subtle">{filtered.length} reports</span>
      </div>

      {/* ─── Main 2-col layout ──────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Report List */}
        <div className="flex flex-col border-r border-subtle bg-base" style={{ width: '380px', minWidth: '380px' }}>
          <div ref={parentRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="shimmer h-[72px] rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                <FileText size={32} className="text-tertiary" />
                <p className="text-sm text-secondary">
                  {riskFilter !== 'All' ? `No ${riskFilter} risk reports` : 'No reports yet'}
                </p>
                {riskFilter !== 'All' && (
                  <Button variant="ghost" size="sm" onClick={() => setRiskFilter('All')}>Show all</Button>
                )}
              </div>
            ) : (
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const r = filtered[virtualRow.index];
                  const isSelected = selected === r.id;
                  return (
                    <div
                      key={virtualRow.key}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div
                        onClick={() => setSelected(r.id)}
                        className={`mx-3 my-1.5 p-3.5 rounded-xl cursor-pointer border transition-all group relative flex items-start gap-3 ${
                          isSelected ? 'border-accent/30 bg-accent/10 shadow-sm' : 'border-transparent hover:bg-subtle hover:border-subtle'
                        }`}
                      >
                        <FileText size={16} className={`shrink-0 mt-0.5 ${isSelected ? 'text-accent' : 'text-tertiary'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate mb-1 ${isSelected ? 'text-accent' : 'text-primary'}`}>{r.title}</p>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs text-tertiary">{format(new Date(r.createdAt), 'MMM dd, HH:mm')}</span>
                            <Badge variant={getRiskVariant(r.overallRisk)}>
                              {r.overallRisk}
                            </Badge>
                          </div>
                        </div>
                        {/* Delete button — appears on hover */}
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(r.id); }}
                          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isSelected ? 'opacity-100 text-tertiary hover:text-risk-extreme hover:bg-risk-extreme/10' : 'opacity-0 group-hover:opacity-100 text-tertiary hover:text-risk-extreme hover:bg-risk-extreme/10'}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Report Viewer */}
        <div className="flex-1 flex flex-col min-w-0 bg-elevated">
            {selectedReport ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Viewer header */}
                <div className="px-8 py-5 border-b border-subtle bg-base shrink-0 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-primary leading-snug">{selectedReport.title}</h2>
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-secondary font-medium bg-subtle px-2.5 py-1 rounded-md border border-subtle">
                        <Calendar size={13} />
                        {format(new Date(selectedReport.createdAt), 'MMMM dd, yyyy HH:mm')} UTC
                      </div>
                      <span className="text-xs font-mono text-secondary bg-subtle px-2.5 py-1 rounded-md border border-subtle">
                        Avg {selectedReport.averageTemperatureCelsius.toFixed(1)}°C · Peak {selectedReport.peakTemperatureCelsius.toFixed(1)}°C
                      </span>
                      {selectedReport.modelUsed && (
                        <Badge variant="outline">{selectedReport.modelUsed}</Badge>
                      )}
                      <Badge variant={getRiskVariant(selectedReport.overallRisk)}>
                        {selectedReport.overallRisk} Risk
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => exportReport(selectedReport)}>
                      <Download size={14} className="mr-2" />
                      Export TXT
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(selectedReport.id)} className="border-risk-extreme/20 text-risk-extreme hover:bg-risk-extreme/5">
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Viewer body */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="prose prose-sm max-w-[800px]">
                    <pre className="text-[14px] leading-relaxed text-secondary whitespace-pre-wrap font-sans">{selectedReport.content}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-subtle border border-default flex items-center justify-center shadow-sm">
                  <FileText size={24} className="text-tertiary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-primary mb-1">Select a Report</p>
                  <p className="text-sm text-secondary">Choose a report from the list to view its contents</p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* ─── Delete Confirm Modal ───────────────────────── */}
      {deleteConfirm && (
        <ConfirmModal
          onConfirm={() => deleteReport.mutate(deleteConfirm!)}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteReport.isPending}
        />
      )}
    </div>
  );
}
