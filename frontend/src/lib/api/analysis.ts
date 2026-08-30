import { apiClient, API_BASE } from './client';
import type { HeatAnalysis, Correlation, Report } from '@/types';

export const analysisApi = {
  analyzeLocation: (locationId: string) =>
    apiClient.get<HeatAnalysis>(`/analysis/location/${locationId}`).then((r) => r.data),

  getCorrelations: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiClient.get<Correlation[]>(`/analysis/correlations?${params}`).then((r) => r.data);
  },

  getTrend: (locationId: string, hoursBack = 24) =>
    apiClient.get(`/analysis/trend/${locationId}?hoursBack=${hoursBack}`).then((r) => r.data),
};

export const reportApi = {
  generate: (locationName?: string) =>
    apiClient.post<Report>('/report/generate', { locationName, reportType: 'Instant' }).then((r) => r.data),

  getRecent: (count = 10) =>
    apiClient.get<Report[]>(`/report?count=${count}`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/report/${id}`),
};

export const agentApi = {
  query: (query: string, location?: string) =>
    apiClient.post<{ response: string; timestamp: string }>('/agent/query', { query, location }).then((r) => r.data),

  streamUrl: () => `${API_BASE}/api/agent/stream`,
};
