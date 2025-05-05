// client/src/services/authToken.js
import api from './api';

// Set token in axios defaults and localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['x-auth-token'] = token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Remove token from axios defaults and localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['x-auth-token'];
  delete api.defaults.headers.common['Authorization'];
};

// Check if token exists and set it
export const initializeAuthToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    setAuthToken(token);
  }
};