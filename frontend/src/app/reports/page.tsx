'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { reportApi } from '@/lib/api/analysis';
import { FileText, Sparkles, Calendar, Loader2, Trash2, Download, AlertTriangle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Report } from '@/types';

const RISK_LEVELS = ['All', 'Extreme', 'High', 'Moderate', 'Low'] as const;
type RiskFilter = typeof RISK_LEVELS[number];

function getRiskColor(risk: string) {
  if (risk === 'Extreme') return 'var(--risk-extreme)';
  if (risk === 'High') return 'var(--risk-high)';
  if (risk === 'Moderate') return 'var(--risk-moderate)';
  return 'var(--risk-low)';
}

function ConfirmModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading?: boolean; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-elevated border border-subtle rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={18} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-primary mb-1">Delete Report</h3>
        <p className="text-sm text-secondary mb-5">This report will be permanently removed. This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-subtle border border-subtle text-secondary text-sm font-medium hover:text-primary transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors">
            {loading && <Loader2 size={14} className="animate-spin" />}Delete
          </button>
        </div>
      </motion.div>
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
      `â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`,
      ``,
      `Title: ${report.title}`,
      `Generated: ${format(new Date(report.createdAt), 'MMMM dd, yyyy HH:mm')} UTC`,
      `Overall Risk: ${report.overallRisk}`,
      `Average Temp: ${report.averageTemperatureCelsius.toFixed(1)}°C`,
      `Peak Temp: ${report.peakTemperatureCelsius.toFixed(1)}°C`,
      `Model: ${report.modelUsed ?? 'N/A'}`,
      ``,
      `â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`,
      ``,
      report.content,
      ``,
      `â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`,
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

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-3 border-b border-subtle flex items-center justify-between shrink-0 bg-elevated">
        <div>
          <h1 className="text-[13px] font-bold text-primary leading-none">AI Risk Reports</h1>
          <p className="text-[10px] text-tertiary mt-0.5">Government-grade advisories Â· Meridian AI</p>
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ color: 'var(--bg-base)' }}
        >
          {generate.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate Report
        </button>
      </div>

      {/* â”€â”€ Risk Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-2 border-b border-subtle shrink-0 bg-subtle flex items-center gap-2">
        <Filter size={11} className="text-tertiary" />
        <span className="text-[10px] text-tertiary font-medium mr-1">Filter:</span>
        {RISK_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setRiskFilter(level)}
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border transition-all ${
              riskFilter === level
                ? 'border-transparent text-white'
                : 'border-subtle text-tertiary hover:text-primary'
            }`}
            style={riskFilter === level && level !== 'All'
              ? { backgroundColor: getRiskColor(level), borderColor: getRiskColor(level) }
              : riskFilter === level
              ? { backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }
              : {}}
          >
            {level}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-tertiary">{filtered.length} reports</span>
      </div>

      {/* â”€â”€ Main 2-col layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Report List */}
        <div className="flex flex-col border-r border-subtle" style={{ width: '340px', minWidth: '340px' }}>
          <div ref={parentRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 flex flex-col gap-2">
                {[...Array(6)].map((_, i) => <div key={i} className="shimmer h-[68px] rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                <FileText size={24} className="text-tertiary" />
                <p className="text-sm text-secondary">
                  {riskFilter !== 'All' ? `No ${riskFilter} risk reports` : 'No reports yet'}
                </p>
                {riskFilter !== 'All' && (
                  <button onClick={() => setRiskFilter('All')} className="text-[11px] text-accent">Show all</button>
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
                        className={`mx-2 my-1 p-3 rounded-lg cursor-pointer border transition-all group relative ${
                          isSelected ? 'border-accent/30 bg-accent-muted' : 'border-transparent hover:bg-subtle hover:border-subtle'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <FileText size={13} className={`shrink-0 mt-0.5 ${isSelected ? 'text-accent' : 'text-tertiary'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-medium truncate mb-1 ${isSelected ? 'text-accent' : 'text-primary'}`}>{r.title}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-tertiary">{format(new Date(r.createdAt), 'MMM dd, HH:mm')}</span>
                              <span
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${getRiskColor(r.overallRisk)}20`, color: getRiskColor(r.overallRisk) }}
                              >
                                {r.overallRisk}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Delete button â€” appears on hover */}
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(r.id); }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={11} />
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
        <div className="flex-1 flex flex-col min-w-0">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div key={selectedReport.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
                {/* Viewer header */}
                <div className="px-6 py-3 border-b border-subtle bg-subtle shrink-0 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] font-bold text-primary leading-snug">{selectedReport.title}</h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] text-secondary">
                        <Calendar size={11} />
                        {format(new Date(selectedReport.createdAt), 'MMMM dd, yyyy HH:mm')} UTC
                      </div>
                      <span className="text-[11px] font-mono text-secondary">
                        Avg {selectedReport.averageTemperatureCelsius.toFixed(1)}°C · Peak {selectedReport.peakTemperatureCelsius.toFixed(1)}°C
                      </span>
                      {selectedReport.modelUsed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-subtle text-tertiary">
                          {selectedReport.modelUsed}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${getRiskColor(selectedReport.overallRisk)}18`, color: getRiskColor(selectedReport.overallRisk) }}
                      >
                        {selectedReport.overallRisk} Risk
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => exportReport(selectedReport)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-subtle border border-subtle text-secondary text-[11px] font-medium hover:text-primary hover:bg-base transition-colors"
                    >
                      <Download size={12} />
                      Export TXT
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(selectedReport.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/20 text-red-500 text-[11px] font-medium hover:bg-red-500/5 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Viewer body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="prose prose-sm max-w-none">
                    <pre className="text-[13px] leading-relaxed text-secondary whitespace-pre-wrap font-sans">{selectedReport.content}</pre>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-subtle border border-subtle flex items-center justify-center">
                  <FileText size={22} className="text-tertiary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-primary mb-1">Select a Report</p>
                  <p className="text-sm text-secondary">Choose a report from the list to view its contents</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* â”€â”€ Delete Confirm Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            onConfirm={() => deleteReport.mutate(deleteConfirm!)}
            onCancel={() => setDeleteConfirm(null)}
            loading={deleteReport.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
