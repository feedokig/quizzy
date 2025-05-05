// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { setAuthToken, removeAuthToken } from '../services/authToken';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        setAuthToken(localStorage.token);
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          removeAuthToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      const res = await api.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      return res.data;
    } catch (err) {
      console.log(err.message)
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      console.log('Login data:', userData); // Отладочный вывод
      const res = await api.post('/api/auth/login', {
        email: userData.email,
        password: userData.password,
      });
  
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
  
      return res.data;
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('token'); // Получение токена из localStorage
      if (!token) {
        throw new Error('No token found. Please log in again.');
      }

      const res = await api.post(
        '/api/auth/update-password',
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Передача токена
          },
        }
      );

      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update password');
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    removeAuthToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    updatePassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}