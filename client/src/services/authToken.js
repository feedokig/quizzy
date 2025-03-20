// client/src/services/authToken.js
import api from './api';

// Set auth token to headers
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete api.defaults.headers.common['x-auth-token'];
  }
};

// Remove auth token from headers
export const removeAuthToken = () => {
  delete api.defaults.headers.common['x-auth-token'];
  localStorage.removeItem('token');
};