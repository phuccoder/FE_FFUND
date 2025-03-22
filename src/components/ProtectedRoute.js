import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Error from 'next/error';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [authState, setAuthState] = useState({
    checked: false,
    authorized: false
  });

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // Check authentication and roles
    const checkAuth = async () => {
      // Not authenticated
      if (!isAuthenticated) {
        // Store the current URL to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login-register?redirect=${encodeURIComponent(currentPath)}`);
        setAuthState({ checked: true, authorized: false });
        return;
      }
      
      // Check role-based access if roles are specified
      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        router.push('/unauthorized');
        setAuthState({ checked: true, authorized: false });
        return;
      }
      
      // User is authorized
      setAuthState({ checked: true, authorized: true });
    };
    
    checkAuth();
  }, [isAuthenticated, userRole, isLoading, router, requiredRoles]);

  // Show loading state while checking auth
  if (isLoading || !authState.checked) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading</h2>
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600">Verifying authentication...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return 401 for unauthenticated users
  if (!isAuthenticated) {
    return <Error statusCode={401} title="Authentication required" />;
  }

  // Return 403 for unauthorized users (wrong role)
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return <Error statusCode={403} title="You don't have permission to access this page" />;
  }

  // Show protected content if authenticated and authorized
  return children;
};