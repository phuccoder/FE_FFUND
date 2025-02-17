import { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Header/Header';
import Image from 'next/image';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showGoogleSetupParam = urlParams.get('showGoogleSetup');
    if (showGoogleSetupParam) {
      setShowGoogleSetup(true);
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-screen min-w-full bg-gray-100 flex items-center justify-center p-2">
        <div className="bg-white rounded-lg shadow-md w-full max-w-full flex overflow-hidden">
          {/* Left side with illustration */}
          <div className="hidden md:flex md:w-1/2 bg-yellow-500 p-12 flex-col justify-between">
            <div className="relative">
              <Image 
                src="/api/placeholder/300/200" 
                alt="Illustration" 
                className="mx-auto"
                width={300}
                height={200}
              />
            </div>
          </div>

          {/* Right side with forms */}
          <div className="w-full md:w-1/2 p-6 md:p-12">
            {!showGoogleSetup && (
              <div className="flex mb-6 border-b border-gray-200">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeTab === 'login'
                      ? 'border-b-2 border-yellow-500 text-yellow-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeTab === 'register'
                      ? 'border-b-2 border-yellow-500 text-yellow-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('register')}
                >
                  Register
                </button>
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {activeTab === 'login' ? 'Log in' : 'Sign up'}
              </h2>
              <div className="text-base md:text-lg text-gray-600">
                {activeTab === 'login' 
                  ? 'Welcome back! Please enter your details.' 
                  : 'Join our community today!'}
              </div>
            </div>

            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </Layout>
  );
}