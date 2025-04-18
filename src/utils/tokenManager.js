import { jwtDecode } from 'jwt-decode';
import { authenticate } from '../services/authenticate';

class TokenManager {
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  // Parse JWT token to get expiration time
  parseJwt(token) {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  // Get token expiration from the JWT payload
  getTokenExpiration() {
    const token = this.getAccessToken();
    if (!token) return null;
    
    const decodedToken = this.parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return null;
    
    // exp is in seconds, convert to milliseconds
    return decodedToken.exp * 1000;
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  isTokenExpired() {
    const expiration = this.getTokenExpiration();
    if (!expiration) return true;

    // Add a 5-minute buffer to refresh the token before it actually expires
    return new Date().getTime() > (expiration - 5 * 60 * 1000);
  }

  async getValidToken() {
    // 1. First get the access token
    const accessToken = this.getAccessToken();
  
    if (!accessToken) {
      console.log('No access token found - user needs to authenticate');
      return null;
    }
  
    // 2. Check if the access token is still valid
    if (!this.isTokenExpired()) {
      return accessToken;
    }
    
    // 3. Token is expired, try to refresh
    console.log('Access token expired, attempting to refresh');
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      console.log('No refresh token available - user needs to re-authenticate');
      this.clearTokens();
      return null;
    }
  
    try {
      // 4. Call the refresh token API - pass the token string directly, not in an object
      const result = await authenticate.refreshToken(refreshToken);
      
      // 5. Check if we have a successful response with data
      if (result && result.data) {
        console.log('Token refresh successful');
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = result.data;
        
        // Store the new tokens
        this.setTokens(newAccessToken, newRefreshToken || refreshToken);
        
        return newAccessToken;
      } else {
        console.log('Token refresh failed - invalid response structure');
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.log('Token refresh failed due to error:', error);
      this.clearTokens();
      return null;
    }
  }

  clearTokens() {
    // Keep specific non-auth items if needed
    const itemsToKeep = {};     
    localStorage.clear();
    // Restore kept items
    Object.entries(itemsToKeep).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    window.dispatchEvent(new Event('storage'));
  }
  
  // Add a method to explicitly store user data from login response
  storeUserData(response) {
    if (response && response.data) {
      const { accessToken, refreshToken} = response.data;
      this.setTokens(accessToken, refreshToken);
    }
  }
}

export const tokenManager = new TokenManager();