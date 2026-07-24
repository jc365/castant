// frontend/src/api/client.ts
import axios from 'axios';

// Guardar estado anterior para comparar
let previousParticipationsData = '';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

// Interceptor de request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response - MODIFICAR AQUÍ
client.interceptors.response.use((response) => {
  const url = response.config.url || '';
  const isParticipations = url.includes('/me/participations');
  
  if (isParticipations) {
    // ✅ Solo log si los datos cambiaron
    const dataStr = JSON.stringify(response.data);
    if (dataStr !== previousParticipationsData) {
      console.log('✅ </users/me/participations> updated:', response.data);
      previousParticipationsData = dataStr;
    }
  } else {
    // ✅ Log normal para otras peticiones
    console.log('✅', response.config.method?.toUpperCase(), url, response.data);
  }
  
  return response;
}, (error) => {
  console.error('❌ API Error:', error.response?.status, error.response?.data);
  return Promise.reject(error);
});

export default client;
