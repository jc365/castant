import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const xUserId = localStorage.getItem('x-user-id');
  if (xUserId) {
    config.headers['X-User-Id'] = xUserId;
  }

  if (import.meta.env.DEV) {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.log(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
