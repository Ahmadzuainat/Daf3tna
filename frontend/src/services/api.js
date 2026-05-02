import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'https://daf3tna.onrender.com';
  return url.endsWith('/api/') ? url : (url.endsWith('/api') ? `${url}/` : `${url}/api/`);
};

const api = axios.create({
  baseURL: getBaseURL()
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
