import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url: string = err.config?.url || '';
      const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot') || url.includes('/auth/reset');
      const onAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => window.location.pathname.startsWith(p));

      // Don't hijack auth-call failures (e.g. wrong password) — let the page show its own error.
      if (!isAuthCall && !onAuthPage) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
