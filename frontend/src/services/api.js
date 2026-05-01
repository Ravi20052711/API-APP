import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const apiKeysAPI = {
  list: () => api.get('/api-keys/'),
  getMarketplace: (category) => api.get('/api-keys/marketplace', { params: { category } }),
  buy: (id) => api.post(`/api-keys/buy/${id}`),
  create: (data) => api.post('/api-keys/', data),
  toggle: (id) => api.put(`/api-keys/${id}/toggle`),
  rotate: (id) => api.post(`/api-keys/${id}/rotate`),
  delete: (id) => api.delete(`/api-keys/${id}`),
};

export const usageAPI = {
  list: (params) => api.get('/usage/', { params }),
  stats: (days = 30) => api.get(`/usage/stats?days=${days}`),
};

export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),
  getSubscription: () => api.get('/billing/subscription'),
  subscribe: (planId) => api.post(`/billing/subscribe/${planId}`),
  createCheckoutSession: (planId) => api.post(`/billing/create-checkout-session/${planId}`),
};

export const webhooksAPI = {
  list: () => api.get('/webhooks/'),
  create: (data) => api.post('/webhooks/', data),
  delete: (id) => api.delete(`/webhooks/${id}`),
};

export default api;
