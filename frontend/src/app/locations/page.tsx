'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi, heatApi } from '@/lib/api/heat';
import {
  MapPin, Thermometer, Plus, X, Loader2, ChevronLeft,
  ChevronRight, Trash2, Zap, Search, Upload, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

function ConfirmModal({ title, message, onConfirm, onCancel, loading }: {
  title: string; message: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-elevated rounded-2xl p-6 w-full max-w-sm mx-4 shadow-token-md">
        <div className="w-10 h-10 rounded-xl bg-risk-extreme/10 flex items-center justify-center mb-4">
          <AlertTriangle size={18} className="text-risk-extreme" />
        </div>
        <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>
        <p className="text-sm text-secondary mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={loading} className="bg-risk-extreme hover:bg-risk-extreme/90 border-transparent text-white">
            {loading && <Loader2 size={14} className="animate-spin mr-2" />}
            Delete
          </Button>
        </div>
      </div>
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
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: ['locations', page, search] });
      const previous = qc.getQueryData(['locations', page, search]);

      const optimisticLocation = {
        id: crypto.randomUUID(), // Fake ID for UI
        ...newData,
        isActive: false,
      };

      qc.setQueryData(['locations', page, search], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticLocation, ...old.data].slice(0, limit),
          totalCount: old.totalCount + 1
        };
      });

      setIsModalOpen(false);
      setFormData({ name: '', city: '', country: '', latitude: '', longitude: '' });
      return { previous };
    },
    onError: (e: any, variables, context) => {
      qc.setQueryData(['locations', page, search], context?.previous);
      toast.error(e.message || 'Failed to add zone');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onSuccess: () => toast.success('New zone added!'),
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
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['locations', page, search] });
      const previous = qc.getQueryData(['locations', page, search]);

      qc.setQueryData(['locations', page, search], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((l: any) => l.id !== id),
          totalCount: Math.max(0, old.totalCount - 1)
        };
      });
      setDeleteConfirm(null);
      return { previous };
    },
    onError: (e: any, id, context) => {
      qc.setQueryData(['locations', page, search], context?.previous);
      toast.error(e.message || 'Failed to delete');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onSuccess: () => toast.success('Location deleted'),
  });

  const deleteAll = useMutation({
    mutationFn: () => locationApi.deleteAll(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['locations'] });
      const previous = qc.getQueryData(['locations', page, search]);

      qc.setQueryData(['locations', page, search], { data: [], totalPages: 1, totalCount: 0 });
      setDeleteAllConfirm(false);
      setPage(1);
      return { previous };
    },
    onError: (e: any, variables, context) => {
      qc.setQueryData(['locations', page, search], context?.previous);
      toast.error(e.message || 'Failed to clear');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onSuccess: () => toast.success('All locations cleared'),
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

      {/* ─── Header ───────────────────────────────────────── */}
      <div className="px-8 py-4 flex items-center justify-between shrink-0 bg-elevated">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-accent-muted flex items-center justify-center">
            <MapPin size={18} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-tertiary mb-1 font-medium">
              <span>Dashboard</span>
              <span className="text-secondary">/</span>
              <span className="text-primary">Locations</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-primary leading-none">Monitoring Zones</h1>
            <p className="text-xs text-tertiary mt-1.5">{totalCount} total locations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Upload */}
          <label className="flex items-center gap-1.5 px-3.5 h-8 rounded-full bg-subtle text-secondary text-xs font-medium hover:bg-accent-muted hover:text-accent transition-colors cursor-pointer">
            <Upload size={14} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={createBulk.isPending} />
          </label>

          {/* Clear All */}
          {totalCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteAllConfirm(true)}
              className="text-risk-extreme border-risk-extreme/20 hover:bg-risk-extreme/10"
            >
              <Trash2 size={14} className="mr-2" />
              Clear All
            </Button>
          )}

          {/* Add Zone */}
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} className="mr-2" />
            Add Zone
          </Button>
        </div>
      </div>

      {/* ── Search Bar ────────────────────────────────────────── */}
      <div className="px-8 py-4 shrink-0 bg-base">
        <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, city, or country…"
              className="w-full h-10 pl-11 pr-4 rounded-full bg-elevated shadow-token-sm text-sm font-medium text-primary placeholder:text-tertiary focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
          {search && (
            <Button type="button" variant="ghost" size="md" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* ─── Grid ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="shimmer h-[170px] rounded-xl" />)}
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <div className="w-14 h-14 rounded-2xl bg-subtle flex items-center justify-center">
              <MapPin size={24} className="text-tertiary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-primary mb-1">{search ? 'No results found' : 'No zones yet'}</p>
              <p className="text-sm text-secondary">{search ? `Try a different search term` : 'Import a CSV or add a zone manually'}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-elevated rounded-2xl p-4 flex flex-col gap-3 shadow-token-sm hover:shadow-token-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-150 group"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <MapPin size={11} className="text-accent shrink-0" />
                      <p className="text-sm font-semibold text-primary truncate">{loc.name}</p>
                    </div>
                    <p className="text-xs text-secondary">{loc.city}, {loc.country}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${loc.isActive ? 'bg-risk-low' : 'bg-[var(--text-tertiary)]/40'}`} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(loc.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0 text-tertiary hover:text-risk-extreme hover:bg-risk-extreme/10 transition-all"
                      title="Delete location"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                {/* Temperature */}
                {loc.latestReading ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Thermometer size={14} color={loc.latestReading.riskColor} />
                        <span className="text-xl font-semibold font-mono tracking-tight text-[color:var(--dynamic-color)]" style={{ '--dynamic-color': loc.latestReading.riskColor } as React.CSSProperties}>
                          {loc.latestReading.temperatureCelsius.toFixed(1)}°C
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full text-[color:var(--dynamic-color)] bg-[color:var(--dynamic-bg)]"
                        style={{
                          '--dynamic-color': loc.latestReading.riskColor,
                          '--dynamic-bg': `${loc.latestReading.riskColor}12`
                        } as React.CSSProperties}
                      >
                        {loc.latestReading.riskLevel}
                      </span>
                    </div>
                    <span className="text-xs text-secondary font-mono">
                      {loc.latestReading.humidityPercent.toFixed(0)}% RH · HI {loc.latestReading.heatIndexCelsius.toFixed(1)}°C
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center">
                    <p className="text-xs text-tertiary italic">Awaiting first reading...</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-subtle">
                  <p className="text-xs text-tertiary font-mono">{loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => ingest(loc.name)}
                    disabled={ingesting === loc.name}
                    className="h-6 px-2 text-xs"
                  >
                    {ingesting === loc.name ? <Loader2 size={10} className="animate-spin mr-1" /> : <Zap size={10} className="mr-1" />}
                    {ingesting === loc.name ? 'Fetching' : 'Ingest'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="px-5 py-2.5 shrink-0 flex items-center justify-between bg-subtle">
          <span className="text-xs text-tertiary">Page {page} of {totalPages} · {totalCount} zones</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 p-0">
              <ChevronLeft size={13} />
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = i + Math.max(1, page - 2);
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="w-7 h-7 p-0 text-xs font-medium"
                >
                  {p}
                </Button>
              );
            })}
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 p-0">
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Add Zone Modal ─────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-elevated rounded-2xl p-6 w-full max-w-md mx-4 shadow-token-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-primary">Add Monitoring Zone</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="w-7 h-7 p-0">
                <X size={15} />
              </Button>
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
                  <label className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-1">{field}</label>
                  <input
                    required
                    value={(formData as any)[field]}
                    onChange={e => setFormData(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-base border border-subtle text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {['latitude', 'longitude'].map(field => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-tertiary uppercase tracking-wider block mb-1">{field}</label>
                    <input
                      required type="number" step="any"
                      value={(formData as any)[field]}
                      onChange={e => setFormData(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md bg-base border border-subtle text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                      placeholder="0.0000"
                    />
                  </div>
                ))}
              </div>
              <Button
                type="submit"
                disabled={createLocation.isPending}
                className="mt-1 w-full flex items-center justify-center gap-2"
              >
                {createLocation.isPending && <Loader2 size={14} className="animate-spin" />}
                Add Zone
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Single Confirm ──────────────────────────── */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Location"
          message="This will permanently delete this location and all its heat readings. This action cannot be undone."
          onConfirm={() => deleteLocation.mutate(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLocation.isPending}
        />
      )}

      {/* ─── Delete All Confirm ─────────────────────────────── */}
      {deleteAllConfirm && (
        <ConfirmModal
          title="Clear All Locations"
          message={`This will permanently delete all ${totalCount} locations and ALL heat readings. This cannot be undone.`}
          onConfirm={() => deleteAll.mutate()}
          onCancel={() => setDeleteAllConfirm(false)}
          loading={deleteAll.isPending}
        />
      )}
    </div>
  );
}
