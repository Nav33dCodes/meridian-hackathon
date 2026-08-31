/** Shared constants for Thermal Vision, used by the pre-paint script and the app. */
export const THERMAL_STORAGE_KEY = 'meridian-thermal';
export const THERMAL_ATTRIBUTE = 'data-thermal';

/**
 * Ironbow ramp for leaflet.heat. Keys start at 0.4 because Map clamps intensity
 * there. The cold end is deliberately lifted off true black: a real thermal
 * camera renders cold as near-black, but on this dark basemap that made
 * low-risk zones vanish entirely, so the ramp trades a little authenticity for
 * every zone staying legible.
 */
export const THERMAL_HEAT_GRADIENT: Record<number, string> = {
  0.4: '#3D1A8A',
  0.55: '#7E1E9C',
  0.68: '#C0246B',
  0.8: '#EF5A15',
  0.9: '#FBA40A',
  1.0: '#FFF6D8',
};

export const DEFAULT_HEAT_GRADIENT: Record<number, string> = {
  0.4: '#2563eb',
  0.6: '#059669',
  0.7: '#d97706',
  0.8: '#dc2626',
  1.0: '#881337',
};

/**
 * Risk colours for map markers. In thermal mode the backend's riskColor would
 * clash with the ironbow ramp, so risk is re-mapped onto it here.
 */
export const THERMAL_RISK_COLOR: Record<string, string> = {
  Low: '#8B5CF6',
  Moderate: '#D6336C',
  High: '#F97316',
  Extreme: '#FFF6D8',
};
