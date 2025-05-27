// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://quizzy-backend-1cq8.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  // Remove withCredentials if not using cookies
  // withCredentials: true,
});

// Interceptors unchanged
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.headers);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status}`, response.data);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default api;