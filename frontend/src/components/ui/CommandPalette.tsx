'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, FileText, Sun, Moon, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { reportApi } from '@/lib/api/analysis';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { heatApi } from '@/lib/api/heat';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: heatApi.getDashboard,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      await reportApi.generate();
      toast.success('AI Report generated successfully!');
      setOpen(false);
      router.push('/reports');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const jumpToLocation = (name: string) => {
    setOpen(false);
    router.push('/locations');
    // Can optionally pass state or query param for search
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setOpen(false);
  };

  // Filter locations
  const locations = dashboard?.latestReadings?.map(r => r.locationName) || [];
  const filteredLocations = search
    ? locations.filter(l => l.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : locations.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-xl mx-4 bg-base rounded-2xl shadow-2xl border border-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-subtle">
          <Search size={18} className="text-tertiary mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-base text-primary placeholder:text-tertiary"
            placeholder="Type a command or search locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="text-xs font-semibold text-tertiary bg-subtle px-2 py-0.5 rounded border border-subtle ml-2">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {search && filteredLocations.length === 0 && (
            <div className="p-4 text-center text-sm text-secondary">
              No results found for "{search}"
            </div>
          )}

          {(!search || filteredLocations.length > 0) && (
            <div className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-tertiary uppercase tracking-wider">Locations</div>
              {filteredLocations.map(loc => (
                <button
                  key={loc}
                  onClick={() => jumpToLocation(loc)}
                  className="w-full flex items-center px-3 py-2.5 text-sm text-primary hover:bg-subtle rounded-xl transition-colors"
                >
                  <MapPin size={16} className="text-secondary mr-3 shrink-0" />
                  Jump to {loc}
                </button>
              ))}
            </div>
          )}

          {!search && (
            <div className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-tertiary uppercase tracking-wider">Actions</div>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full flex items-center px-3 py-2.5 text-sm text-primary hover:bg-subtle rounded-xl transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={16} className="text-accent mr-3 shrink-0 animate-spin" /> : <Sparkles size={16} className="text-accent mr-3 shrink-0" />}
                Run AI Heat Advisory Report
              </button>
              <button
                onClick={() => { setOpen(false); router.push('/reports'); }}
                className="w-full flex items-center px-3 py-2.5 text-sm text-primary hover:bg-subtle rounded-xl transition-colors"
              >
                <FileText size={16} className="text-secondary mr-3 shrink-0" />
                View Reports
              </button>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-3 py-2.5 text-sm text-primary hover:bg-subtle rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} className="text-secondary mr-3 shrink-0" /> : <Moon size={16} className="text-secondary mr-3 shrink-0" />}
                Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
