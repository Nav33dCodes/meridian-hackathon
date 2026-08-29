import { apiClient } from './client';
import type { DashboardSummary, HeatReading, Location, Report } from '@/types';

export const heatApi = {
  getDashboard: () =>
    apiClient.get<DashboardSummary>('/heat/dashboard').then((r) => r.data),

  getAll: () =>
    apiClient.get<HeatReading[]>('/heat').then((r) => r.data),

  getByLocation: (locationId: string, limit = 50) =>
    apiClient.get<HeatReading[]>(`/heat/location/${locationId}?limit=${limit}`).then((r) => r.data),

  ingest: (location: string) =>
    apiClient.post<HeatReading>('/heat/ingest', { location, saveToDatabase: true }).then((r) => r.data),

  getHistory: (hours = 24) =>
    apiClient.get<HeatReading[]>(`/heat/history?hours=${hours}`).then((r) => r.data),
};

export const locationApi = {
  getPaginated: (page = 1, limit = 50, search = '') =>
    apiClient.get<{ data: Location[], totalCount: number, page: number, totalPages: number }>(`/location?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).then((r) => r.data),

  getAll: () =>
    apiClient.get<{ data: Location[] }>('/location').then((r) => r.data.data),

  create: (data: { name: string; city: string; country: string; latitude: number; longitude: number }) =>
    apiClient.post<Location>('/location', data).then((r) => r.data),
    
  createBulk: (data: Array<{ name: string; city: string; country: string; latitude: number; longitude: number }>) =>
    apiClient.post<Location[]>('/location/bulk', data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/location/${id}`),

  deleteAll: () =>
    apiClient.delete('/location/all'),
};

export const reportApi = {
  getRecent: (count = 100) =>
    apiClient.get<Report[]>(`/report?count=${count}`).then((r) => r.data),

  generate: () =>
    apiClient.post<Report>('/report/generate', {}).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/report/${id}`),
};

