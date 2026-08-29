import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5250';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error ?? err.message ?? 'Network error';
    return Promise.reject(new Error(message));
  }
);
