import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';
import { DEFAULT_TIMEZONE, detectUserTimezone } from '../utils/timezone';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezoneState] = useState(() => {
    // Load timezone from localStorage, or detect from browser, or use default
    const saved = localStorage.getItem('app_timezone');
    if (saved) return saved;

    // Try to detect browser timezone on first load
    try {
      return detectUserTimezone();
    } catch (error) {
      console.error('Error detecting timezone:', error);
      return DEFAULT_TIMEZONE;
    }
  });

  useEffect(() => {
    checkAuth();
  }, []);

  // Save timezone to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('app_timezone', timezone);
  }, [timezone]);

  const checkAuth = async () => {
    try {
      const response = await api.auth.check();
      if (response.authenticated) {
        const userData = await api.auth.me();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await api.auth.login(credentials);
    setUser(response.user);
    return response;
  };

  const register = async (userData) => {
    return await api.auth.register(userData);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const setTimezone = (newTimezone) => {
    setTimezoneState(newTimezone);
  };

  const value = {
    user, // Restored
    setUser,
    loading,
    timezone,
    setTimezone,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};