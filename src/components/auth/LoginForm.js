import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ToastContainer, toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';
import { authenticate } from '@/utils/authenticate';
import 'react-toastify/dist/ReactToastify.css';

export const LoginForm = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [googleSetupData, setGoogleSetupData] = useState({
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showGoogleSetupParam = urlParams.get('showGoogleSetup');
    if (showGoogleSetupParam) {
      setShowGoogleSetup(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authenticate.login(formData);
      router.push('/');
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authenticate.initiateGoogleLogin();
  };

  const handleGoogleSetupSubmit = async (e) => {
    e.preventDefault();
    if (googleSetupData.password !== googleSetupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authenticate.completeGoogleSetup(googleSetupData);
      toast.success('Account setup complete');
      router.push('/');
    } catch (error) {
      toast.error('Failed to complete account setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (showGoogleSetup) {
    return (
      <div className="flex min-h-screen bg-orange-100 p-10">
        <div className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="w-full p-6">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Google Account Setup</h2>
              <form onSubmit={handleGoogleSetupSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                    placeholder="Create a password"
                    value={googleSetupData.password}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, password: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                    placeholder="Confirm your password"
                    value={googleSetupData.confirmPassword}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                  <select
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                    value={googleSetupData.role}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, role: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select a role</option>
                    <option value="FOUNDER">Founder</option>
                    <option value="INVESTOR">Investor</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-orange-400"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Setting up account...</span>
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-orange-100 p-10">
      <div className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="w-full p-6">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="Enter your email"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-yellow-500 border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  <label className="ml-2 text-sm text-gray-600">Remember for 30 days</label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm text-orange-600 hover:text-orange-500"
                >
                  Forgot Password?
                </button>
              </div>
              
              <button
                type="submit"
                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-yellow-400"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-center">
                  Sign in with Google
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};