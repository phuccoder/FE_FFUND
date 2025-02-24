import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
const GOOGLE_CLIENT_ID = '304094440461-in6615ihk31rar586rh7nndp19ojoi2h.apps.googleusercontent.com';
const CALLBACK_URL = 'http://localhost:3000/authenticate';

const authenticatedFetch = async (url, options = {}) => {
  const token = await tokenManager.getValidToken();
  
  if (!token) {
    // Redirect to login if we can't get a valid token
    window.location.href = '/login-register';
    throw new Error('Authentication required');
  }
  
  // Clone the options to avoid mutating the original
  const authOptions = { ...options };
  
  // Set headers with authorization
  authOptions.headers = {
    ...authOptions.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, authOptions);
};

export const authenticate = {
  login: async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  initiateGoogleLogin: () => {
    const targetUrl = `${GOOGLE_AUTH_URL}?redirect_uri=${encodeURIComponent(
      CALLBACK_URL
    )}&response_type=code&client_id=${GOOGLE_CLIENT_ID}&scope=openid%20email%20profile`;
    
    window.location.href = targetUrl;
  },

  handleGoogleCallback: async (code) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/outbound/google/authentication?code=${code}`,
        {
          method: 'POST',
        }
      );
      
      if (!response.ok && response.status !== 202) {
        throw new Error('Google authentication failed');
      }
      
      return response;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  },

  completeGoogleSetup: async (setupData) => {
    try {
      const token = localStorage.getItem('token');
      const body = {
        password: setupData.password,
        confirmPassword: setupData.confirmPassword,
        role: setupData.role.toUpperCase(),
      };

      // Validate the setup data
      if (!body.password || !body.confirmPassword || !body.role) {
        throw new Error('All fields are required');
      }

      console.log('Setup Data:', body); // Log the setup data

      const response = await fetch(`${API_BASE_URL}/user/account-setup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to complete account setup');
      }

      return response;
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  },
   // Refresh the authentication token
   refreshToken: (refreshData) => {
    return fetch(`${API_BASE_URL}/api/auth/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refreshData)
    });
  },
  
  // Check if user is authenticated
  isAuthenticated: async () => {
    return await tokenManager.getValidToken() !== null;
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login-register';
  },
  
  getAuthenticatedFetch: () => authenticatedFetch
};