import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Read token from localStorage on EVERY request.
// This is resilient to HMR reloads and page refreshes.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
