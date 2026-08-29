'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { locationApi, heatApi } from '@/lib/api/heat';
import {
  MapPin, Thermometer, Plus, X, Loader2, ChevronLeft,
  ChevronRight, Trash2, Zap, Search, Upload, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

function ConfirmModal({ title, message, onConfirm, onCancel, loading }: {
  title: string; message: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-elevated border border-subtle rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
      >
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={18} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-primary mb-1">{title}</h3>
        <p className="text-sm text-secondary mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-subtle border border-subtle text-secondary text-sm font-medium hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LocationsPage() {
  const qc = useQueryClient();
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 12;
  const [formData, setFormData] = useState({ name: '', city: '', country: '', latitude: '', longitude: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['locations', page, search],
    queryFn: () => locationApi.getPaginated(page, limit, search),
  });

  const locations = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const totalCount = paginatedData?.totalCount || 0;

  const createLocation = useMutation({
    mutationFn: (data: Parameters<typeof locationApi.create>[0]) => locationApi.create(data),
    onSuccess: () => {
      toast.success('New zone added!');
      setIsModalOpen(false);
      setFormData({ name: '', city: '', country: '', latitude: '', longitude: '' });
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to add zone'),
  });

  const createBulk = useMutation({
    mutationFn: (data: Parameters<typeof locationApi.createBulk>[0]) => locationApi.createBulk(data),
    onSuccess: (data) => {
      toast.success(`${data.length} zones imported!`);
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to import'),
  });

  const deleteLocation = useMutation({
    mutationFn: (id: string) => locationApi.delete(id),
    onSuccess: () => {
      toast.success('Location deleted');
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const deleteAll = useMutation({
    mutationFn: () => locationApi.deleteAll(),
    onSuccess: () => {
      toast.success('All locations cleared');
      setDeleteAllConfirm(false);
      setPage(1);
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to clear'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
        const locs = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 5) {
            locs.push({ name: parts[0], city: parts[1], country: parts[2], latitude: parseFloat(parts[3]), longitude: parseFloat(parts[4]) });
          }
        }
        if (locs.length > 0) createBulk.mutate(locs);
        else toast.error('No valid rows found. Expected: Name,City,Country,Lat,Lng');
      } catch { toast.error('Failed to parse CSV'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const ingest = async (name: string) => {
    setIngesting(name);
    try {
      await heatApi.ingest(name);
      toast.success(`Ingested: ${name}`);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['locations'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIngesting(null);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-base">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 py-4 border-b border-subtle flex items-center justify-between shrink-0 bg-elevated">
        <div>
          <div className="flex items-center gap-2 text-xs text-tertiary mb-1 font-medium">
            <span>Dashboard</span>
            <span className="text-secondary">/</span>
            <span className="text-primary">Locations</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">Monitoring Zones</h1>
          <p className="text-xs text-tertiary mt-1">{totalCount} total locations</p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Upload */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-subtle border border-subtle text-secondary text-[11px] font-medium hover:bg-base hover:text-primary transition-colors cursor-pointer">
            <Upload size={12} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={createBulk.isPending} />
          </label>

          {/* Clear All */}
          {totalCount > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-subtle border border-red-500/20 text-red-500 text-[11px] font-medium hover:bg-red-500/5 transition-colors"
            >
              <Trash2 size={12} />
              Clear All
            </button>
          )}

          {/* Add Zone */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-[11px] font-semibold hover:opacity-90 transition-opacity"
            style={{ color: 'var(--bg-base)' }}
          >
            <Plus size={12} />
            Add Zone
          </button>
        </div>
      </div>

      {/* ── Search Bar ────────────────────────────────────────── */}
      <div className="px-5 py-2.5 border-b border-subtle shrink-0 bg-subtle">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, city, or country…"
              className="w-full h-8 pl-8 pr-3 rounded-md bg-base border border-subtle text-[12px] text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
          <button type="submit" className="h-8 px-4 rounded-md bg-accent text-[11px] font-medium hover:opacity-90" style={{ color: 'var(--bg-base)' }}>
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="px-3 py-1.5 rounded-md border border-subtle text-[11px] text-secondary hover:text-primary">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* â”€â”€ Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="shimmer h-[170px] rounded-xl" />)}
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <div className="w-14 h-14 rounded-2xl bg-subtle border border-subtle flex items-center justify-center">
              <MapPin size={24} className="text-tertiary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-primary mb-1">{search ? 'No results found' : 'No zones yet'}</p>
              <p className="text-sm text-secondary">{search ? `Try a different search term` : 'Import a CSV or add a zone manually'}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {locations.map((loc, i) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-elevated border border-subtle rounded-xl p-4 flex flex-col gap-3 hover:border-default transition-colors group"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MapPin size={11} className="text-accent shrink-0" />
                        <p className="text-[13px] font-semibold text-primary truncate">{loc.name}</p>
                      </div>
                      <p className="text-[11px] text-secondary">{loc.city}, {loc.country}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${loc.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <button
                        onClick={() => setDeleteConfirm(loc.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Delete location"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Temperature */}
                  {loc.latestReading ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Thermometer size={14} color={loc.latestReading.riskColor} />
                          <span className="text-xl font-bold font-mono tracking-tight" style={{ color: loc.latestReading.riskColor }}>
                            {loc.latestReading.temperatureCelsius.toFixed(1)}°C
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
                          style={{
                            color: loc.latestReading.riskColor,
                            borderColor: `${loc.latestReading.riskColor}30`,
                            backgroundColor: `${loc.latestReading.riskColor}12`
                          }}
                        >
                          {loc.latestReading.riskLevel}
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary font-mono">
                        {loc.latestReading.humidityPercent.toFixed(0)}% RH · HI {loc.latestReading.heatIndexCelsius.toFixed(1)}°C
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center">
                      <p className="text-[11px] text-tertiary italic">Awaiting first reading...</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-subtle">
                    <p className="text-[10px] text-tertiary font-mono">{loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}</p>
                    <button
                      onClick={() => ingest(loc.name)}
                      disabled={ingesting === loc.name}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                      style={{
                        color: 'var(--accent)',
                        backgroundColor: 'var(--accent-muted)',
                        border: '1px solid var(--accent-border)'
                      }}
                    >
                      {ingesting === loc.name ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                      {ingesting === loc.name ? 'Fetching' : 'Ingest'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {totalPages > 1 && (
        <div className="px-5 py-2.5 border-t border-subtle shrink-0 flex items-center justify-between bg-subtle">
          <span className="text-[11px] text-tertiary">Page {page} of {totalPages} Â· {totalCount} zones</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-md border border-subtle flex items-center justify-center text-secondary hover:text-primary disabled:opacity-40 transition-colors">
              <ChevronLeft size={13} />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = i + Math.max(1, page - 2);
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md text-[11px] font-medium transition-colors border ${p === page ? 'bg-accent border-transparent' : 'border-subtle text-secondary hover:text-primary'}`}
                  style={p === page ? { color: 'var(--bg-base)' } : {}}
                >
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-md border border-subtle flex items-center justify-center text-secondary hover:text-primary disabled:opacity-40 transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Add Zone Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-elevated border border-subtle rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-primary">Add Monitoring Zone</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-tertiary hover:text-primary hover:bg-subtle transition-colors">
                  <X size={15} />
                </button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  createLocation.mutate({
                    name: formData.name, city: formData.city, country: formData.country,
                    latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude)
                  });
                }}
                className="flex flex-col gap-3"
              >
                {['name', 'city', 'country'].map(field => (
                  <div key={field}>
                    <label className="text-[11px] font-semibold text-tertiary uppercase tracking-wider block mb-1">{field}</label>
                    <input
                      required
                      value={(formData as any)[field]}
                      onChange={e => setFormData(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-base border border-subtle text-[13px] text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {['latitude', 'longitude'].map(field => (
                    <div key={field}>
                      <label className="text-[11px] font-semibold text-tertiary uppercase tracking-wider block mb-1">{field}</label>
                      <input
                        required type="number" step="any"
                        value={(formData as any)[field]}
                        onChange={e => setFormData(f => ({ ...f, [field]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-base border border-subtle text-[13px] text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                        placeholder="0.0000"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={createLocation.isPending}
                  className="mt-1 w-full py-2 rounded-lg bg-accent text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ color: 'var(--bg-base)' }}
                >
                  {createLocation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Add Zone
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Delete Single Confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="Delete Location"
            message="This will permanently delete this location and all its heat readings. This action cannot be undone."
            onConfirm={() => deleteLocation.mutate(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
            loading={deleteLocation.isPending}
          />
        )}
      </AnimatePresence>

      {/* â”€â”€ Delete All Confirm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {deleteAllConfirm && (
          <ConfirmModal
            title="Clear All Locations"
            message={`This will permanently delete all ${totalCount} locations and ALL heat readings. This cannot be undone.`}
            onConfirm={() => deleteAll.mutate()}
            onCancel={() => setDeleteAllConfirm(false)}
            loading={deleteAll.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
