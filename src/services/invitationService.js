import { tokenManager } from "@/utils/tokenManager";

const API_URL = 'https://quanbeo.duckdns.org/api/v1/invitation';

export const invitationService = {
  // Get all invitations with pagination
  getInvitations: async (page = 0, size = 10) => {
    try {
      const token = await tokenManager.getValidToken();
      const response = await fetch(`${API_URL}?page=${page}&size=${size}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Get response as text first for better error handling
      const responseText = await response.text();
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        if (!response.ok) {
          throw new Error(responseText || `Error: ${response.status}`);
        }
        return [];
      }
      
      // If response wasn't successful, extract error message from result
      if (!response.ok) {
        const errorMessage = result.error || 
          result.message || 
          (typeof result === 'string' ? result : null) || 
          `Error: ${response.status}`;
        
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  },

  // Get single invitation by ID
  getInvitationById: async (id) => {
    try {
      const token = await tokenManager.getValidToken();
      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Get response as text first for better error handling
      const responseText = await response.text();
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        if (!response.ok) {
          throw new Error(responseText || `Error: ${response.status}`);
        }
        return null;
      }
      
      // If response wasn't successful, extract error message from result
      if (!response.ok) {
        const errorMessage = result.error || 
          result.message || 
          (typeof result === 'string' ? result : null) || 
          `Error: ${response.status}`;
        
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error(`Error fetching invitation with ID ${id}:`, error);
      throw error;
    }
  },

  // Update invitation status
  updateInvitationStatus: async (id, status) => {
    try {
      const token = await tokenManager.getValidToken();

      // Use the status value directly as the request body, without wrapping it in an object
      const requestBody = status; // Just the status string: "ACCEPTED" or "DECLINED"
      console.log(`Updating invitation ${id} with request body:`, requestBody);

      // Log request details
      console.log('API Request:', {
        url: `${API_URL}/${id}`,
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer [TOKEN]', // Don't log actual token
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody) // Stringify the status string directly
      });

      // Get response as text first for better error handling
      const responseText = await response.text();
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        if (!response.ok) {
          throw new Error(responseText || `Error: ${response.status}`);
        }
        // Return a success object if the response is ok but not valid JSON
        return { success: true, message: "Invitation status updated successfully" };
      }
      
      // If response wasn't successful, extract error message from result
      if (!response.ok) {
        const errorMessage = result.error || 
          result.message || 
          (typeof result === 'string' ? result : null) || 
          `Error: ${response.status}`;
        
        throw new Error(errorMessage);
      }

      console.log(`Invitation ${id} update response:`, result);
      return result;
    } catch (error) {
      console.error(`Error updating invitation status for ID ${id}:`, error);
      throw error;
    }
  },

  // Helper method specifically for accepting/declining invitations
  respondToInvitation: async (id, isAccepted) => {
    const status = isAccepted ? "ACCEPTED" : "DECLINED";
    console.log(`Responding to invitation ${id} with status: ${status}`);

    // Create the raw status value as it will appear in updateInvitationStatus
    console.log(`Invitation response raw value:`, status);

    return invitationService.updateInvitationStatus(id, status);
  },

  searchFounderByEmail: async (email) => {
    try {
      const token = await tokenManager.getValidToken();
      const response = await fetch(`${API_URL}/founder?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        // Remove the body from GET request
      });

      // Get response as text first for better error handling
      const responseText = await response.text();
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        if (!response.ok) {
          throw new Error(responseText || `Error: ${response.status}`);
        }
        return [];
      }
      
      // If response wasn't successful, extract error message from result
      if (!response.ok) {
        const errorMessage = result.error || 
          result.message || 
          (typeof result === 'string' ? result : null) || 
          `Error: ${response.status}`;
        
        throw new Error(errorMessage);
      }

      console.log('Search results:', result); // For debugging
      return result;
    } catch (error) {
      console.error('Error in searchFounderByEmail:', error);
      throw error;
    }
  }
};

export default invitationService;