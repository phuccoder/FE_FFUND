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

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
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

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update invitation status API error:', {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText
        });
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Error searching founder by email: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search results:', data); // For debugging
      return data;
    } catch (error) {
      console.error('Error in searchFounderByEmail:', error);
      throw error;
    }
  }
};

export default invitationService;