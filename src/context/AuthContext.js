import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticate } from 'src/services/authenticate';
import { tokenManager } from '@/utils/tokenManager';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

// Define restricted paths for MANAGER and ADMIN users
const MANAGER_ADMIN_RESTRICTED_PATHS = [
  '/payment',
  '/create-project',
  '/edit-project',
  '/profile',
  '/',
  '/contact',
  '/about',
  '/faq',
  'founder-invesments',
  'founder-transaction',
  'funded-projects',
  'investment-reward',
  '/invitation',
  'payment',
  'projects-1',
  '/request/report',
  '/reward',
  '/single-project',
  '/team-member',
  '/auth/verify-email',
  '/auth/reset-password',
  '/payment/cancel',
  '/payment/success',
  '/stripe/onboard',
  '/stripe/refresh',
  '/team/create',
  '/team/invite'
];

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [teamRole, setTeamRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if a path is restricted for managers and admins
  const isRestrictedForManagerAdmin = (path) => {
    return MANAGER_ADMIN_RESTRICTED_PATHS.some(restrictedPath => 
      path === restrictedPath || 
      path.startsWith(`${restrictedPath}/`) ||
      // Handle dynamic routes
      (restrictedPath.includes('[') && path.match(new RegExp(restrictedPath.replace(/\[.*?\]/g, '[^/]+'))))
    );
  };

  // Process route changes to enforce access restrictions
  useEffect(() => {
    // Skip if still loading auth state
    if (isLoading) return;
    
    // Check if current user is MANAGER or ADMIN and trying to access a restricted page
    if (isAuthenticated && 
        (userRole === 'MANAGER' || userRole === 'ADMIN') && 
        isRestrictedForManagerAdmin(router.pathname)) {
      router.push('/access-denied');
    }
  }, [router.pathname, isAuthenticated, userRole, isLoading]);

  useEffect(() => {
    // Check authentication on mount and when localStorage changes
    const checkAuth = async () => {
      setIsLoading(true);
      const isAuth = await authenticate.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const role = localStorage.getItem('role');
        setUserRole(role);
        setTeamRole(localStorage.getItem('teamRole'));
        
        // Check current route when auth state is first determined
        if ((role === 'MANAGER' || role === 'ADMIN') && 
            isRestrictedForManagerAdmin(router.pathname)) {
          router.push('/access-denied');
        }
      } else {
        setUserRole(null);
        setTeamRole(null);
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
      setTeamRole(data.data.teamRole);
      
      // Check if the user is manager/admin and redirect if needed
      if ((data.data.role === 'MANAGER' || data.data.role === 'ADMIN') && 
          isRestrictedForManagerAdmin(router.pathname)) {
        router.push('/access-denied');
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authenticate.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setTeamRole(null);
  };

  // Utility function to check if current user can access a path
  const canAccessPath = (path) => {
    if (!isAuthenticated) return false;
    
    // MANAGER and ADMIN cannot access restricted paths
    if ((userRole === 'MANAGER' || userRole === 'ADMIN') && 
        isRestrictedForManagerAdmin(path)) {
      return false;
    }
    
    return true;
  };

  const value = {
    isAuthenticated,
    userRole,
    teamRole,
    isLoading,
    login,
    logout,
    canAccessPath,
    isRestrictedForManagerAdmin
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