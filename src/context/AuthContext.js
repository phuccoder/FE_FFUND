import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticate } from 'src/services/authenticate';
import { tokenManager } from '@/utils/tokenManager';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount and when localStorage changes
    const checkAuth = async () => {
      setIsLoading(true);
      const isAuth = await authenticate.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        setUserRole(localStorage.getItem('role'));
      } else {
        setUserRole(null);
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage events (like logout from another tab)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authenticate.login(credentials);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      setIsAuthenticated(true);
      setUserRole(data.data.role);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authenticate.logout();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const value = {
    isAuthenticated,
    userRole,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};