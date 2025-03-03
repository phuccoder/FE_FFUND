import { authenticate } from '../services/authenticate';

class TokenManager {
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  getTokenExpiration() {
    return localStorage.getItem('tokenExpiration');
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);

    // Calculate and store expiration time (current time + 1 hour in milliseconds)
    const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour
    localStorage.setItem('tokenExpiration', expirationTime);

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  isTokenExpired() {
    const expiration = this.getTokenExpiration();
    if (!expiration) return true;

    // Add a 5-minute buffer to refresh the token before it actually expires
    return new Date().getTime() > (parseInt(expiration) - 5 * 60 * 1000);
  }

  // Modify the getValidToken function in your TokenManager class
  async getValidToken() {
    const accessToken = this.getAccessToken();
  
    // First check if we even have a token
    if (!accessToken) {
      console.log('No access token found - user may need to authenticate');
      return null;
    }
  
    if (!this.isTokenExpired()) {
      return accessToken;
    }
  
    // Try to refresh the token
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.log('No refresh token available - user may need to re-authenticate');
      return null;
    }
  
    try {
      const response = await authenticate.refreshToken({ token: refreshToken });
      const data = await response.json();
  
      if (response.ok && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken || refreshToken);
        return data.accessToken;
      } else {
        console.log('Token refresh failed - user needs to re-authenticate');
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.log('Token refresh failed due to network or server error:', error);
      this.clearTokens();
      return null;
    }
  }

  clearTokens() {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
  }
}

export const tokenManager = new TokenManager();