// All API calls in one place
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Auto-attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: data => api.post('/auth/register', data),
  login:    data => api.post('/auth/login', data),
  me:       ()   => api.get('/auth/me'),
};

export const uploadAPI = {
  upload:    form     => api.post('/upload/', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStatus: reportId => api.get(`/upload/status/${reportId}`),
};

export const reportsAPI = {
  summary:  ()         => api.get('/reports/summary'),
  list:     ()         => api.get('/reports/'),
  get:      id         => api.get(`/reports/${id}`),
  delete:   id         => api.delete(`/reports/${id}`),
};

export default api;
