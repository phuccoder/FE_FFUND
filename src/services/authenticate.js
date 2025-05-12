import { toast } from 'react-toastify';
import { tokenManager } from '../utils/tokenManager';

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
const GOOGLE_CLIENT_ID = '304094440461-in6615ihk31rar586rh7nndp19ojoi2h.apps.googleusercontent.com';
const CALLBACK_URL = 'https://deploy-f-fund-b4n2.vercel.app/authenticate';

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
      console.log('Sending login request with:', {
        ...formData,
        password: '***********' // Don't log actual password
      });
  
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });
  
      console.log('Login response status:', response.status);
  
      // Get response text first to see actual error message
      const responseText = await response.text();
      console.log('Login response text:', responseText);
  
      // Try to parse JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Not JSON - use text as error message
        if (!response.ok) {
          throw {
            message: `Login failed: ${responseText}`,
            status: response.status
          };
        }
        throw {
          message: 'Invalid response format from server',
          status: response.status
        };
      }
  
      // If response is not OK, throw an error with the message from the server
      if (!response.ok) {
        throw {
          message: data.error || data.message || 'Login failed',
          error: data.error,
          status: response.status,
          data: data
        };
      }
  
      // Check if the structure has a nested 'data' property
      const payload = data.data || data;
  
      if (!payload.accessToken) {
        console.error('Missing accessToken in response:', data);
        throw {
          message: 'Invalid response: missing access token',
          data: data
        };
      }
  
      tokenManager.setTokens(payload.accessToken, payload.refreshToken);
      localStorage.setItem('role', payload.role);
      localStorage.setItem('userId', payload.userId);
  
      return {
        data: payload // Return consistent structure
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  initiateGoogleLogin: () => {
    const targetUrl = `${GOOGLE_AUTH_URL}?redirect_uri=${encodeURIComponent(
      CALLBACK_URL
    )}&response_type=code&client_id=${GOOGLE_CLIENT_ID}&scope=openid%20email%20profile`;

    console.log('Initiating Google login with URL:', targetUrl);
    window.location.href = targetUrl;
  },

  handleGoogleCallback: async (code) => {
    try {
      console.log('Handling Google callback with code:', code.substring(0, 5) + '...');

      const response = await fetch(
        `${API_BASE_URL}/auth/outbound/google/authentication?code=${code}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Google auth response status:', response.status);

      // Get response text first to see actual error message
      const responseText = await response.text();
      console.log('Google auth response text:', responseText);

      // Try to parse JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Not JSON - use text as error message
        if (!response.ok) {
          throw new Error(`Google authentication failed: ${responseText}`);
        }
        throw new Error('Invalid response format from server');
      }

      if (!response.ok && response.status !== 202) {
        throw new Error(data.message || 'Google authentication failed');
      }

      // Check if the structure has a nested 'data' property
      const payload = data.data || data;

      if (!payload.accessToken) {
        console.error('Missing accessToken in response:', data);
        throw new Error('Invalid response: missing access token');
      }

      tokenManager.setTokens(payload.accessToken, payload.refreshToken);
      localStorage.setItem('role', payload.role);
      localStorage.setItem('userId', payload.userId);

      return {
        data: payload // Return consistent structure
      };
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  },

  completeGoogleSetup: async (setupData) => {
    try {
      // Get token from tokenManager instead of localStorage
      const token = await tokenManager.getValidToken();

      if (!token) {
        throw new Error('Authentication required to complete setup');
      }

      let response;
      let body;

      // Use different endpoints based on role
      if (setupData.role.toUpperCase() === 'FOUNDER') {
        // Create the founder-specific request body
        body = {
          password: setupData.password,
          confirmPassword: setupData.confirmPassword,
          studentCode: setupData.studentCode,
          exeClass: setupData.exeClass,
          fptFacility: setupData.fptFacility,
        };

        // Validate the setup data
        if (!body.password || !body.confirmPassword) {
          throw new Error('Password fields are required');
        }

        if (!body.studentCode) {
          throw new Error('Student code is required for Founders');
        }

        console.log('Founder Setup Data:', {
          ...body,
          password: '***********',
          confirmPassword: '***********'
        });

        response = await fetch(`${API_BASE_URL}/user/account-setup/founder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
        });
      } else if (setupData.role.toUpperCase() === 'INVESTOR') {
        // Create the investor-specific request body
        body = {
          password: setupData.password,
          confirmPassword: setupData.confirmPassword,
        };

        // Validate the setup data
        if (!body.password || !body.confirmPassword) {
          throw new Error('Password fields are required');
        }

        console.log('Investor Setup Data:', {
          ...body,
          password: '***********',
          confirmPassword: '***********'
        });

        response = await fetch(`${API_BASE_URL}/user/account-setup/investor`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
        });
      } else {
        throw new Error('Invalid role selected');
      }

      console.log('Account setup response status:', response.status);

      // Get response text first to see actual error message
      const responseText = await response.text();
      console.log('Account setup response text:', responseText);

      // Try to parse JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Not JSON - use text as error message
        if (!response.ok) {
          throw new Error(`Failed to complete account setup: ${responseText}`);
        }
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete account setup');
      }

      // Check if the structure has a nested 'data' property
      const payload = data.data || data;

      if (!payload.accessToken) {
        console.error('Missing accessToken in response:', data);
        throw new Error('Invalid response: missing access token');
      }

      tokenManager.setTokens(payload.accessToken, payload.refreshToken);
      localStorage.setItem('role', payload.role);
      localStorage.setItem('userId', payload.userId);

      return {
        data: payload 
      };
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  },

  // Refresh the authentication token
  refreshToken: async (refreshToken) => {
    try {
      const tokenValue = typeof refreshToken === 'object' && refreshToken.token ? 
        refreshToken.token : refreshToken;
        
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenValue }),
      });
  
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Failed to refresh token:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    return await tokenManager.getValidToken() !== null;
  },

  logout: () => {
    tokenManager.clearTokens();
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('founderProjectId');
    window.location.href = '/login-register';
  },

  getAuthenticatedFetch: () => authenticatedFetch
};