import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authenticate } from 'src/services/authenticate';

export const LoginForm = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [googleSetupData, setGoogleSetupData] = useState({
    password: '',
    confirmPassword: '',
    role: '',
    studentCode: '',
    exeClass: 'EXE201',
    fptFacility: 'CAN_THO',
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setShowGoogleSetup(urlParams.has('showGoogleSetup'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Print out request body for debugging
    const requestBody = {
      username: formData.username,
      password: formData.password,
      rememberMe: formData.rememberMe
    };

    // Safe logging (hide actual password)
    console.log('Login request body:', {
      ...requestBody,
      password: '********'
    });

    try {
      // authenticate.login already parses the JSON and returns the data
      const data = await authenticate.login(formData);

      // Log response
      console.log('Login response:', data);

      // Pass the data directly to handleAuthSuccess
      handleAuthSuccess(data);
    } catch (error) {
      console.error('Login error details:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (response) => {
    console.log('Auth success:', response); // Add logging

    // Check if we have the data property
    if (!response || !response.data) {
      console.error('Invalid auth data:', response);
      toast.error('Login successful but received invalid data');
      return;
    }

    const data = response.data;

    // Now check the properties inside data
    if (!data.accessToken || !data.role) {
      console.error('Invalid auth data:', data);
      toast.error('Login successful but received invalid data');
      return;
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', data.userId);
    if (data.teamRole) {
      localStorage.setItem('teamRole', data.teamRole);
      console.log('Stored teamRole in localStorage:', data.teamRole);
    }

    // For debugging - verify role was stored correctly
    console.log('Role stored in localStorage:', data.role);
    console.log('Verifying localStorage value:', localStorage.getItem('role'));
    console.log('User ID:', data.userId);

    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const handleGoogleLogin = () => {
    authenticate.initiateGoogleLogin();
  };

  const handleGoogleSetupSubmit = async (e) => {
    e.preventDefault();

    // Validate password confirmation
    if (googleSetupData.password !== googleSetupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate that a role is selected
    if (!googleSetupData.role) {
      toast.error('Please select a role');
      return;
    }

    // Role-specific validation
    if (googleSetupData.role === 'FOUNDER') {
      if (!googleSetupData.studentCode) {
        toast.error('Student code is required for Founders');
        return;
      }
      if (!googleSetupData.exeClass) {
        toast.error('EXE Class is required for Founders');
        return;
      }
      if (!googleSetupData.fptFacility) {
        toast.error('FPT Facility is required for Founders');
        return;
      }
    }

    setIsLoading(true);
    try {
      // The updated completeGoogleSetup will handle routing to the correct endpoint
      const data = await authenticate.completeGoogleSetup(googleSetupData);

      toast.success('Account setup complete');
      // Handle successful setup
      handleAuthSuccess(data);
    } catch (error) {
      // Extract and display specific error message
      let errorMessage = 'Failed to complete account setup';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (showGoogleSetup) {
    return (
      <div className="flex min-h-screen bg-orange-100 p-10">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="w-full p-6">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Google Account Setup</h2>
              <form onSubmit={handleGoogleSetupSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                    placeholder="Create a password"
                    value={googleSetupData.password}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, password: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                    placeholder="Confirm your password"
                    value={googleSetupData.confirmPassword}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="role">
                    Select Role
                  </label>
                  <select
                    id="role"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                    value={googleSetupData.role}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, role: e.target.value })}
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="FOUNDER">Founder</option>
                    <option value="INVESTOR">Investor</option>
                  </select>
                </div>

                {/* Conditional fields for FOUNDER role */}
                {googleSetupData.role === 'FOUNDER' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="studentCode">
                        Student Code
                      </label>
                      <input
                        id="studentCode"
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                        placeholder="Enter your student code"
                        value={googleSetupData.studentCode}
                        onChange={(e) => setGoogleSetupData({ ...googleSetupData, studentCode: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="exeClass">
                        EXE Class
                      </label>
                      <select
                        id="exeClass"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                        value={googleSetupData.exeClass}
                        onChange={(e) => setGoogleSetupData({ ...googleSetupData, exeClass: e.target.value })}
                        required
                      >
                        <option value="EXE201">EXE201</option>
                        <option value="EXE403">EXE403</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="fptFacility">
                        FPT Facility
                      </label>
                      <select
                        id="fptFacility"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                        value={googleSetupData.fptFacility}
                        onChange={(e) => setGoogleSetupData({ ...googleSetupData, fptFacility: e.target.value })}
                        required
                      >
                        <option value="CAN_THO">CAN THO</option>
                        <option value="DA_NANG">DA NANG</option>
                        <option value="HA_NOI">HA NOI</option>
                        <option value="HO_CHI_MINH">HO CHI MINH</option>
                        <option value="QUY_NHON">QUY NHON</option>
                      </select>
                    </div>
                  </>
                )}

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
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="Enter your email"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
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
                    id="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-yellow-500 border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                    Remember for 30 days
                  </label>
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