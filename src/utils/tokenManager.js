import { authenticate } from './authenticate';

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

  async getValidToken() {
    if (!this.isTokenExpired()) {
      return this.getAccessToken();
    }
    
    // Try to refresh the token
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // No refresh token available, user needs to log in again
      return null;
    }
    
    try {
      const response = await authenticate.refreshToken({ token: refreshToken });
      const data = await response.json();
      
      if (response.ok && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken || refreshToken);
        return data.accessToken;
      } else {
        // Refresh failed, clear tokens
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('role');
    window.dispatchEvent(new Event('storage'));
  }
}

export const tokenManager = new TokenManager();