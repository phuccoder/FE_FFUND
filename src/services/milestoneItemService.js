import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const MILESTONE_ITEM_GET_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/item/${id}`;
const MILESTONE_ITEM_CREATE_ENDPOINT = (id) => `${API_BASE_URL}/item/${id}`;
const MILESTONE_ITEM_UPDATE_ENDPOINT = (id) => `${API_BASE_URL}/item/${id}`;
const MILESTONE_ITEM_DELETE_ENDPOINT = (id) => `${API_BASE_URL}/item/${id}`;
const MILESTONE_ITEM_UPLOAD_IMAGE_ENDPOINT = (id) => `${API_BASE_URL}/item/${id}`;

export const milestoneItemService = {
    /**
     * Get a milestone item by id
     * @param {number} itemId
     * @returns {Promise<Response>}
     * @throws {Error}
    */
    getMilestoneItemById: async (itemId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_ITEM_GET_BY_ID_ENDPOINT(itemId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to get milestone item by id:', error);
            throw error;
        }
    },
    /**
     * Create a milestone item
     * @param {number} milestoneId
     * @param {object} itemData
     * @returns {Promise<Response>}
     * @throws {Error}
    */
    createMilestoneItem: async (milestoneId, itemData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_ITEM_CREATE_ENDPOINT(milestoneId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to create milestone item:', error);
            throw error;
        }
    },
    /**
     * Update a milestone item
     * @param {number} itemId
     * @param {object} itemData
     * @returns {Promise<Response>}
     * @throws {Error}
    */
    updateMilestoneItem: async (itemId, itemData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_ITEM_UPDATE_ENDPOINT(itemId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to update milestone item:', error);
            throw error;
        }
    },
    /**
     * Delete a milestone item
     * @param {number} itemId
     * @returns {Promise<Response>}
     * @throws {Error}
    */
    deleteMilestoneItem: async (itemId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_ITEM_DELETE_ENDPOINT(itemId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to delete milestone item:', error);
            throw error;
        }
    },
    /**
 * Upload an image for a milestone item
 * @param {number} itemId
 * @param {File} imageFile
 * @returns {Promise<object>} The response data
 * @throws {Error}
 */
    uploadMilestoneItemImage: async (itemId, imageFile) => {
        try {
            const token = await tokenManager.getValidToken();
            const formData = new FormData();
            formData.append('image', imageFile);
            const response = await fetch(MILESTONE_ITEM_UPLOAD_IMAGE_ENDPOINT(itemId), {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to upload milestone item image:', error);
            throw error;
        }
    }
};