import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login-register');
      return;
    }
    
    // Check role-based access if roles are specified
    if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, userRole, isLoading, router, requiredRoles]);

  // Show loading state while checking auth
  if (isLoading) {
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

  // Show unauthorized page if role doesn't match
  if (!isLoading && requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return null; // Will be redirected by useEffect
  }

  // Show protected content if authenticated and authorized
  return isAuthenticated ? children : null;
};