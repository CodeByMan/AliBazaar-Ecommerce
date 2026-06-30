import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
export const IMAGE_BASE_URL = (import.meta.env.VITE_IMAGE_BASE_URL || `${API_BASE_URL}/uploads`).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
    return Promise.reject(error);
  },
);

export const getApiError = (error, fallback = 'Something went wrong') => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || error?.message || fallback;
};

export const resolveImageUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const clean = String(value).replace(/\\/g, '/').replace(/^\/+/, '').replace(/^uploads\//i, '');
  return `${IMAGE_BASE_URL}/${clean.split('/').map(encodeURIComponent).join('/')}`;
};
