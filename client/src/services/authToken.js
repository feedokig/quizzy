// client/src/services/authToken.js
import api from './api';

// Set auth token to headers
export const setAuthToken = (token) => {
  if (token) {
    // Устанавливаем токен в заголовок Authorization
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Для совместимости с middleware auth.js также устанавливаем x-auth-token
    api.defaults.headers.common['x-auth-token'] = token;
    // Сохраняем токен в localStorage
    localStorage.setItem('token', token);
  } else {
    // Удаляем все заголовки если токена нет
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('token');
  }
};

// Remove auth token from headers
export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
  delete api.defaults.headers.common['x-auth-token'];
  localStorage.removeItem('token');
};