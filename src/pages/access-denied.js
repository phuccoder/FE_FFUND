import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';

const AccessDenied = () => {
  const { userRole } = useAuth();

  const isRegularUser = userRole === 'INVESTOR' || userRole === 'FOUNDER';
  
  return (
    <Layout>
      <div className="py-20 min-h-screen flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-20 h-20 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h1>
          
          <div className="text-gray-600 mb-8">
            {!isRegularUser ? (
              <>
                <p className="mb-4">
                  Sorry, as a manager or administrator, you don&apos;t have access to this page.
                </p>
                <p>
                  This area is restricted to regular users only.
                </p>
              </>
            ) : (
              <>
                <p className="mb-4">
                  Sorry, you don&apos;t have permission to access this page.
                </p>
                <p>
                  Please contact the administrator if you believe this is an error.
                </p>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login-register">
              <a className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-300">
                Return to Login/Register
              </a>
            </Link>

            {!isRegularUser && (
              <Link href="https://admin-ffund.vercel.app/login">
                <a className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-300">
                  Go to Admin/Manager Page
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccessDenied;