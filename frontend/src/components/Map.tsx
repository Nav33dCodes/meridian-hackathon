'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { HeatReading } from '@/types';
import HeatmapLayer from './HeatmapLayer';
import { Layers } from 'lucide-react';

// Fix Leaflet's default icon issue with Next.js SSR
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  data: HeatReading[];
}

export default function Map({ data }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'heatmap' | 'markers'>('heatmap');
  const { resolvedTheme } = useTheme();

  // Create a beautiful glowing marker using DivIcon
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-heat-marker',
      html: `<div style="background-color: ${color}; box-shadow: 0 0 10px ${color}, 0 0 20px ${color}; width: 14px; height: 14px; border-radius: 50%; opacity: 0.9;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-subtle shimmer flex items-center justify-center text-sm text-tertiary">Loading Map...</div>;
  }

  // Calculate center based on data, default to Dubai if no data
  const center: [number, number] = data.length > 0
    ? [data[0].latitude ?? 25.2048, data[0].longitude ?? 55.2708]
    : [25.2048, 55.2708];

  const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_2h2f_1_4173fd78da0b8728b9022689';
  const mapStyle = resolvedTheme === 'dark' ? 'dark_all' : 'light_all';

  // Prepare heatmap data: mapping temperature to an intensity value (0.0 to 1.0)
  // Clamp minimum to 0.4 so even very cold temperatures are highly visible on the map.
  const heatmapData: Array<[number, number, number]> = data
    .filter(r => r.latitude && r.longitude)
    .map(r => {
      // Scale: 0°C -> 0.4, 45°C -> 1.0
      const intensity = Math.max(0.4, Math.min(1.0, 0.4 + (r.temperatureCelsius / 75)));
      return [r.latitude!, r.longitude!, intensity];
    });

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        className="bg-subtle"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url={`https://{s}.basemaps.cartocdn.com/${mapStyle}/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
      {viewMode === 'heatmap' ? (
        <HeatmapLayer data={heatmapData} theme={resolvedTheme} />
      ) : (
        data.map((reading) => {
          if (!reading.latitude || !reading.longitude) return null;
          return (
            <Marker
              key={reading.id}
              position={[reading.latitude, reading.longitude]}
              icon={createCustomIcon(reading.riskColor || 'var(--accent)')}
            >
              <Popup className="heat-popup">
                <div className="p-1">
                  <p className="font-bold text-sm mb-1">{reading.locationName}</p>
                  <p className="text-xs">{reading.temperatureCelsius.toFixed(1)}°C / {reading.humidityPercent.toFixed(0)}% RH</p>
                  <p className="text-xs uppercase font-bold mt-1 text-[color:var(--dynamic-color)]" style={{ '--dynamic-color': reading.riskColor } as React.CSSProperties}>{reading.riskLevel}</p>
                </div>
              </Popup>
            </Marker>
          );
        })
      )}
    </MapContainer>
      <div className="absolute top-4 right-4 z-[9999] pointer-events-auto">
        <button
          onClick={() => setViewMode(prev => prev === 'heatmap' ? 'markers' : 'heatmap')}
          className="flex items-center gap-2 px-3 py-2 bg-elevated border border-subtle shadow-token-md rounded-md text-xs font-medium text-primary hover:bg-subtle transition-colors"
        >
          <Layers size={16} />
          {viewMode === 'heatmap' ? 'Show Markers' : 'Show Heatmap'}
        </button>
      </div>
    </div>
  );
}
