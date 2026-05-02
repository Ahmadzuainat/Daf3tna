import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5003/api'
});

api.interceptors.request.use(
  (config) => {
    // Read token from zustand persist storage
    try {
      const stored = localStorage.getItem('daf3tna-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch {
      // ignore parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth and redirect to login
      localStorage.removeItem('daf3tna-auth');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
