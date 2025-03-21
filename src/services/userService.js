import { tokenManager } from '../utils/tokenManager';

/**
 * Get user data by ID (from the authenticated user)
 * @returns {Promise<Object>} User data
 */

export const getUserById = async () => {
    try {
        const token = await tokenManager.getValidToken();
        const userId = localStorage.getItem('userId'); 
        console.log('userId:', userId);

        if (!token) {
            throw new Error('Authentication token is missing or invalid');
        }

        const response = await fetch(`http://localhost:8080/api/v1/user/${userId}`, {
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
            throw new Error(result.message || 'Failed to fetch user data');
        }
    } catch (error) {
        console.error('Error in getUserById:', error);
        throw error;
    }
};

/**
 * Update user profile information
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (userData) => {
    try {
        const token = await tokenManager.getValidToken();
        const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
        const { fullName, username, telephoneNumber, identifyNumber, userInformation, userFfundLink } = userData;

        const response = await fetch(`http://localhost:8080/api/v1/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                username,
                telephoneNumber,
                identifyNumber,
                userInformation,
                userFfundLink
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw error;
    }
};

/**
 * Upload user avatar
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Result of the upload
 */
export const uploadAvatar = async (file) => {
    try {
        const token = await tokenManager.getValidToken()
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8080/api/v1/user/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in uploadAvatar:', error);
        throw error;
    }
};

/**
 * Get founder information by user ID
 * @returns {Promise<Object>} Founder information data
 */
export const getUserExtendedInfo = async () => {
    try {
        const token = await tokenManager.getValidToken();
        const userId = localStorage.getItem('userId');

        if (!token) {
            throw new Error('Authentication token is missing or invalid');
        }

        const response = await fetch(`http://localhost:8080/api/v1/founder-information/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // If not found or other error, return default structure
            if (response.status === 404) {
                console.log('User information not found, returning default structure');
                return {
                    studentClass: "",
                    studentCode: "",
                    exeClass: "",
                    fptFacility: ""
                };
            }
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 200 && result.data) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch founder information data');
        }
    } catch (error) {
        console.error('Error in getUserExtendedInfo:', error);
        throw error;
    }
};

/**
 * Create new founder information for a user
 * @param {Object} founderData - Founder information to create
 * @returns {Promise<Object>} Result of the creation
 */
export const createUserExtendedInfo = async (founderData) => {
    try {
        const token = await tokenManager.getValidToken();
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:8080/api/v1/founder-information/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(founderData)
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in createUserExtendedInfo:', error);
        throw error;
    }
};

/**
 * Update founder information
 * @param {Object} founderData - Founder information to update
 * @returns {Promise<Object>} Result of the update
 */
export const updateUserExtendedInfo = async (founderData) => {
    try {
        const token = await tokenManager.getValidToken();
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:8080/api/v1/founder-information/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(founderData)
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in updateUserExtendedInfo:', error);
        throw error;
    }
};

/**
 * Upload student portfolio PDF file
 * @param {File} file - PDF file to upload
 * @returns {Promise<Object>} Result of the upload
 */
export const uploadStudentPortfolio = async (file) => {
    try {
        const token = await tokenManager.getValidToken();
        const userId = localStorage.getItem('userId');
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://localhost:8080/api/v1/founder-information/upload-portfolio/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in uploadStudentPortfolio:', error);
        throw error;
    }
};