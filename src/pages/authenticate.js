import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authenticate } from '@/utils/authenticate';
import { ToastContainer, toast } from 'react-toastify';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

const roles = [
  { id: 1, name: 'Founder', value: 'FOUNDER' },
  { id: 2, name: 'Investor', value: 'INVESTOR' },
];

const Authenticate = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [googleSetupData, setGoogleSetupData] = useState({
    password: '',
    confirmPassword: '',
    role: roles[0]
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showGoogleSetupParam = urlParams.get('showGoogleSetup');
    if (showGoogleSetupParam) {
      setShowGoogleSetup(true);
      setIsLoading(false);
      return;
    }

    const handleGoogleCallback = async () => {
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setError('Authentication was cancelled or failed');
        setIsLoading(false);
        return;
      }

      if (!code) {
        setError('No authentication code received');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authenticate.handleGoogleCallback(code);
        
        if (response.ok) {
          const data = await response.json();
          
          localStorage.setItem('token', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);

          if (data.data.role === 'UNKNOWN') {
            router.push('/login-register?showGoogleSetup=true');
          } else {
            toast.success('Successfully logged in');
            router.push('/');
          }
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Google authentication error:', error);
        setError('Failed to complete authentication');
        toast.error('Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    if (router.isReady) {
      handleGoogleCallback();
    }
  }, [router.isReady, router]);

  const handleGoogleSetupSubmit = async (e) => {
    e.preventDefault();
    if (googleSetupData.password !== googleSetupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authenticate.completeGoogleSetup({
        ...googleSetupData,
        role: googleSetupData.role.value
      });
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
      <div className="flex min-h-screen bg-purple-100 p-10">
        <div className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="w-full p-6">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Account Setup</h2>
              <form onSubmit={handleGoogleSetupSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Confirm your password"
                    value={googleSetupData.confirmPassword}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                  <Listbox
                    value={googleSetupData.role}
                    onChange={(role) => setGoogleSetupData({ ...googleSetupData, role })}
                  >
                    <div className="relative mt-1">
                      <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <span className="block truncate">{googleSetupData.role.name}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronsUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {roles.map((role) => (
                            <Listbox.Option
                              key={role.id}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                  active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                                }`
                              }
                              value={role}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                    {role.name}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-500">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-indigo-400"
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
        <ToastContainer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login-register')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Return to Login
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authenticating</h2>
          {isLoading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600">Completing authentication...</span>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Authenticate;