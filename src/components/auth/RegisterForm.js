import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const RegisterForm = () => {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState('FOUNDER');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentCode: '',
    exeClass: 'EXE201',
    fptFacility: 'CAN_THO',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    setError('');
    setIsLoading(true);

    // Create a new object for submission instead of destructuring
    const dataToSubmit = {
      fullName: formData.fullName,
      username: formData.username,
      password: formData.password,
      phone: formData.phone
    };

    // Add founder-specific fields only if the role is FOUNDER
    if (activeRole === 'FOUNDER') {
      dataToSubmit.studentCode = formData.studentCode;
      dataToSubmit.exeClass = formData.exeClass;
      dataToSubmit.fptFacility = formData.fptFacility;
    }

    try {
      const apiUrl =
        activeRole === 'FOUNDER'
          ? 'https://ffund.duckdns.org/api/v1/auth/register/founder'
          : 'https://ffund.duckdns.org/api/v1/auth/register';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        toast.success('Registration successful! Please check your email for verification instructions.', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Clear form data on success
        setFormData({
          fullName: '',
          username: '',
          password: '',
          confirmPassword: '',
          phone: '',
          studentCode: '',
          exeClass: 'EXE201',
          fptFacility: 'CAN_THO',
        });

        // Optional: Redirect after short delay
        setTimeout(() => {
          router.push('/login-register');
        }, 3000);

      } else {
        // Handle error response with better error extraction
        try {
          const errorData = await response.json();
          // Make sure errorData.message or errorData.error is a string
          const errorMessage = errorData.message ||
            errorData.error ||
            'Registration failed. Please try again.';

          // If errorData.message or errorData.error might be objects, convert them to strings
          const errorMessageString = typeof errorMessage === 'object'
            ? JSON.stringify(errorMessage)
            : errorMessage;

          toast.error(errorMessageString, {
            position: "top-right",
            autoClose: 5000,
          });

          setError(errorMessageString);
        } catch (jsonError) {
          toast.error(`Registration failed: ${response.statusText}`, {
            position: "top-right",
            autoClose: 5000,
          });
          setError(`Registration failed: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setFormData({
      ...formData,
      studentCode: role === 'FOUNDER' ? '' : undefined,
      exeClass: role === 'FOUNDER' ? 'EXE201' : undefined,
      fptFacility: role === 'FOUNDER' ? 'CAN_THO' : undefined,
    });
  };

  return (
    <div className="flex min-h-screen bg-orange-100 pt-0 p-10 ">
      

      <div className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="w-full p-6">
          <div className="max-w-md mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}

            <div className="flex space-x-4 mb-8">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeRole === 'FOUNDER'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                onClick={() => handleRoleChange('FOUNDER')}
              >
                Founder
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeRole === 'INVESTOR'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                onClick={() => handleRoleChange('INVESTOR')}
              >
                Investor
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              {/* Additional founder-specific fields */}
              {activeRole === 'FOUNDER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Code</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                      placeholder="Enter your student code"
                      value={formData.studentCode}
                      onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">EXE Class</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                      value={formData.exeClass}
                      onChange={(e) => setFormData({ ...formData, exeClass: e.target.value })}
                      required
                    >
                      <option value="EXE201">EXE201</option>
                      <option value="EXE403">EXE403</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">FPT Facility</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                      value={formData.fptFacility}
                      onChange={(e) => setFormData({ ...formData, fptFacility: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-orange-500"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-yellow-400"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Register'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};