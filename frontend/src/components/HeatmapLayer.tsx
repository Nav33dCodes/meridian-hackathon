import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  data: Array<[number, number, number]>; // [lat, lng, intensity]
}

export default function HeatmapLayer({ data }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    const gradient = {
      0.4: '#2563eb', // Deeper Blue
      0.6: '#059669', // Deeper Emerald
      0.7: '#d97706', // Deeper Amber
      0.8: '#dc2626', // Deeper Red
      1.0: '#881337'  // Deep Rose
    };

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
  }, [map, data]);

  return null;
}
