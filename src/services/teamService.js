// services/teamService.js

import { tokenManager } from '../utils/tokenManager';
import { getUserExtendedInfo } from './userService';

/**
 * Get team member details by memberId
 * @param {number} memberId - The ID of the team member
 * @returns {Promise<Object>} - Team member details
 */
export const getTeamMemberDetail = async (memberId) => {
  try {
    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/member/detail/${memberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch team member details');
    }
  } catch (error) {
    console.error('Error in getTeamMemberDetail:', error);
    throw error;
  }
};

/**
 * Get team by ID
 * @param {number} teamId - The ID of the team
 * @returns {Promise<Object>} - Team data
 */
export const getTeamById = async (teamId) => {
  try {
    const token = await tokenManager.getValidToken();

    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/${teamId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch team data');
    }
  } catch (error) {
    console.error('Error in getTeamById:', error);
    throw error;
  }
};

/**
 * Create a new team
 * @param {string} teamName - The name of the team
 * @param {string} teamDescription - The description of the team
 * @param {Array<string>} memberEmails - Array of member emails to invite
 * @returns {Promise<Object>} - Created team data
 */
/**
 * Creates a new team with given name, description and member emails
 * @param {string} teamName - The name of the team to create
 * @param {string} teamDescription - Description of the team
 * @param {Array<string>} memberEmails - Array of email addresses to invite
 * @returns {Promise<Object>} - API response data
 */
export const createTeam = async (teamName, teamDescription, memberEmails = []) => {
  try {
    const token = await tokenManager.getValidToken();

    const response = await fetch('https://quanbeo.duckdns.org/api/v1/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        teamName,
        teamDescription,
        memberEmails
      })
    });

    const data = await response.json();

    // Check if the response is okay (status in 200-299 range)
    if (response.ok) {
      console.log("Team created successfully:", data);
      return data;
    } else {
      throw new Error(data.message || `Failed to create team (${response.status})`);
    }
  } catch (error) {
    console.error("Error in createTeam:", error);
    throw error;
  }
};

/**
 * Invite a new member to the team
 * @param {string} memberEmail - Email of the member to invite
 * @returns {Promise<Object>} - Invitation result
 */
// Add to src/services/teamService.js
export const inviteMember = async (memberEmail) => {
  try {
    const token = await tokenManager.getValidToken();

    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const requestBody = { memberEmail };
    console.log('inviteMember API request:', {
      url: `https://quanbeo.duckdns.org/api/v1/team/invitations`,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer [TOKEN]', // Don't log actual token
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Member invitation API error:', {
        status: response.status,
        statusText: response.statusText,
        errorResponse: errorText
      });
      throw new Error(`Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Member invitation API success:', result);

    return result.data;
  } catch (error) {
    console.error('Error in inviteMember:', error);
    throw error;
  }
};

/**
 * Get user's team data
 * This retrieves the user's extended info first, then uses the teamId to get team details
 * @returns {Promise<Object>} - Team data or null if user has no team
 */
export const getUserTeam = async () => {
  try {
    const userInfo = await getUserExtendedInfo();

    if (userInfo && userInfo.teamId) {
      return await getTeamById(userInfo.teamId);
    }

    return null;
  } catch (error) {
    console.error('Error in getUserTeam:', error);
    throw error;
  }
};

/**
 * Convert API team data to format expected by TeamItem component
 * @param {Object} teamData - Team data from API
 * @returns {Array} - Array of team member objects in the format expected by TeamItem
 */
export const convertTeamDataForUI = (teamData) => {
  if (!teamData || !teamData.teamMembers) return [];

  return teamData.teamMembers.map((member) => ({
    id: member.memberId,
    name: member.memberName,
    tagline: member.teamRole,
    title: member.memberName,
    image: member.memberAvatar ? member.memberAvatar.split('/').pop() : "default-avatar.jpg",
    socials: [
      {
        id: 1,
        icon: "fa fa-envelope",
        href: `mailto:${member.memberEmail}`
      }
    ]
  }));
};

/**
 * Update a team member's role
 * @param {number} memberId - The ID of the team member
 * @param {string} teamRole - The new role for the team member
 * @returns {Promise<Object>} - Updated member data
 */
export const updateMemberRole = async (memberId, teamRole) => {
  try {
    const token = await tokenManager.getValidToken();

    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/member/role/${memberId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teamRole
      })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();

    // Changed condition to properly handle success cases
    if (result.status === 200) {
      // Return either the data property or the whole result if data doesn't exist
      return result.data || result;
    } else {
      throw new Error(result.message || 'Failed to update member role');
    }
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    throw error;
  }
};

/**
 * Remove a member from the team
 * @param {number} memberId - The ID of the team member to remove
 * @returns {Promise<Object>} - Response data
 */
export const removeMember = async (memberId) => {
  try {
    const token = await tokenManager.getValidToken();

    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/member/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 200) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to remove team member');
    }
  } catch (error) {
    console.error('Error in removeMember:', error);
    throw error;
  }
};

/**
 * Delete an entire team
 * @param {number} teamId - The ID of the team to delete
 * @returns {Promise<Object>} - Response data
 */
export const deleteTeam = async (teamId) => {
  try {
    const token = await tokenManager.getValidToken();

    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 200) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to delete team');
    }
  } catch (error) {
    console.error('Error in deleteTeam:', error);
    throw error;
  }
};

/**
 * Get team member information by memberId
 * @param {number} memberId - The ID of the team member
 * @returns {Promise<Object>} - Team member data
 */
export const getTeamMemberInfo = async (memberId) => {
  try {
    const token = await tokenManager.getValidToken();

    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/team-member-information/${memberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 200 && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch team member data');
    }
  } catch (error) {
    console.error('Error in getTeamMemberInfo:', error);
    throw error;
  }
};

/**
 * Updates team information
 * @param {number|string} teamId - The ID of the team to update
 * @param {Object} teamData - Object containing updated team information
 * @param {string} teamData.teamName - Updated team name
 * @param {string} teamData.teamDescription - Updated team description
 * @returns {Promise<Object>} - API response data
 */
export const updateTeam = async (teamId, teamData) => {
  try {
    const token = await tokenManager.getValidToken();
    if (!teamId) {
      throw new Error("Team ID is required");
    }

    const response = await fetch(`https://quanbeo.duckdns.org/api/v1/team/${teamId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update team (${response.status})`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating team:", error);
    throw error;
  }
};

/**
 * Check if the current user is the team admin and has appropriate permissions
 * @param {Object} teamData - Team data from API
 * @param {Object} currentUser - Current user data
 * @returns {Promise<Object>} - Admin status and permissions
 */
export const isTeamAdmin = async (teamData, currentUser) => {
  // Default result with no permissions
  const defaultResult = {
    isAdmin: false,
    canUpdateRoles: false,
    canDeleteMembers: false,
    canDeleteTeam: false
  };

  if (!teamData || !currentUser) {
    console.log('Missing team data or current user');
    return defaultResult;
  }

  try {
    // Log the raw currentUser data to debug
    console.log('Raw currentUser data in isTeamAdmin:', currentUser);

    // Extract the teamRole from the login response - highest priority source
    const userRole = currentUser.teamRole;

    // Extract founder status - either from explicit role or isFounder flag
    const isFounder = currentUser.role === 'FOUNDER' || Boolean(currentUser.isFounder);

    // Log values to debug
    console.log('teamRole in isTeamAdmin:', userRole);
    console.log('isFounder in isTeamAdmin:', isFounder);

    // If no teamRole available from login response, we don't need the other checks
    // since we're prioritizing the login response data as requested
    if (!userRole) {
      console.log('No teamRole in login response - defaulting to non-admin');
      return defaultResult;
    }

    // Set permissions based on role from login response
    const isLeader = userRole === 'LEADER';
    console.log('isLeader check:', userRole, '===', 'LEADER', '=', isLeader);

    // Create the permissions object
    const permissions = {
      isAdmin: isLeader,
      canUpdateRoles: isLeader,
      canDeleteMembers: isLeader,
      canDeleteTeam: isLeader && isFounder
    };

    // Log for debugging
    console.log(`Team admin check using login response data for user ${currentUser.id || currentUser.email}:`, {
      teamRole: userRole,
      isLeader,
      isFounder,
      role: currentUser.role,
      permissions
    });

    return permissions;

  } catch (error) {
    console.error('Error determining user permissions:', error);
    return defaultResult;
  }
};