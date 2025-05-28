// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setAuthToken, removeAuthToken } from '../services/authToken';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Check token expiration
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            console.log('Token expired');
            removeAuthToken();
            setUser(null);
            setIsAuthenticated(false);
            navigate('/login');
            return;
          }

          setAuthToken(token);
          console.log('Attempting to load user with token');
          const res = await api.get('/api/auth/me');
          console.log('User loaded successfully:', res.data);
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to load user:', err.response?.data || err.message);
          removeAuthToken();
          setUser(null);
          setIsAuthenticated(false);
          navigate('/login');
        }
      } else {
        console.log('No token found in localStorage');
      }
      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const register = async (userData) => {
    try {
      console.log('Registering user:', { ...userData, password: '[HIDDEN]' });
      const res = await api.post('/api/auth/register', userData);
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setError(null);
        console.log('Registration successful:', { user: res.data.user });
        return res.data;
      } else {
        throw new Error('No token received from registration');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const login = async (userData) => {
    try {
      console.log('Login attempt:', { email: userData.email, password: '[HIDDEN]' });
      const res = await api.post('/api/auth/login', {
        email: userData.email,
        password: userData.password,
      });
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        setError(null);
        console.log('Login successful:', { user: res.data.user });
        return res.data;
      } else {
        throw new Error('No token received from login');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      console.log('Updating password');
      const res = await api.post('/api/auth/update-password', { currentPassword, newPassword });
      console.log('Password update response:', res.data);
      return res.data;
    } catch (err) {
      console.error('Password update error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const logout = () => {
    console.log('Logging out user');
    removeAuthToken();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    updatePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}