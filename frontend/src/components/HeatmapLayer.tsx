import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { DEFAULT_HEAT_GRADIENT, THERMAL_HEAT_GRADIENT } from '@/lib/thermal';

interface HeatmapLayerProps {
  data: Array<[number, number, number]>; // [lat, lng, intensity]
  thermal?: boolean;
}

export default function HeatmapLayer({ data, thermal = false }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    const gradient = thermal ? THERMAL_HEAT_GRADIENT : DEFAULT_HEAT_GRADIENT;

    // Create the heat layer
    const heatLayer = (L as any).heatLayer(data, {
      radius: 35, // Slightly larger for better visibility
      blur: 25,
      maxZoom: 10,
      max: 1.0, // Max intensity
      gradient
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data, thermal]);

  return null;
}
