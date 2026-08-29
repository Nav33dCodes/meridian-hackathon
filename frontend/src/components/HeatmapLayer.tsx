import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  data: Array<[number, number, number]>; // [lat, lng, intensity]
  theme?: string;
}

export default function HeatmapLayer({ data, theme = 'dark' }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    // Define vibrant gradients based on theme
    const darkGradient = {
      0.4: '#3b82f6', // Bright Blue
      0.6: '#10b981', // Emerald
      0.7: '#f59e0b', // Amber
      0.8: '#ef4444', // Red
      1.0: '#9f1239'  // Rose/Extreme
    };

    const lightGradient = {
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
      gradient: theme === 'dark' ? darkGradient : lightGradient
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data]);

  return null;
}
