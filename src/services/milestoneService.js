import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const MILESTONE_BY_PHASEID_ENDPOINT = (id) => `${API_BASE_URL}/milestone/phase/${id}`;
const MILESTONE_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/milestone/${id}`;
const MILESTONE_CREATE_ENDPOINT_FOR_PHASE = (id) => `${API_BASE_URL}/milestone/${id}`;
const MILESTONE_UPDATE_ENDPOINT = (id) => `${API_BASE_URL}/milestone/${id}`;
const MILESTONE_DELETE_ENDPOINT = (id) => `${API_BASE_URL}/milestone/${id}`;

export const milestoneService = {
    /**
     * Get all milestones for a phase
     * @param {number} phaseId
     * @returns {Promise<Response>}
     * @throws {Error}
    */
    getMilestonesByPhaseId: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_BY_PHASEID_ENDPOINT(phaseId), {
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
            console.error('Failed to get milestones by phase id:', error);
            throw error;
        }
    },  
    /**
     * Get a milestone by id
     * @param {number} milestoneId
     * @returns {Promise<Response>}
     * @throws {Error}
    */
    getMilestoneById: async (milestoneId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_BY_ID_ENDPOINT(milestoneId), {
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
            console.error('Failed to get milestone by id:', error);
            throw error;
        }
    },
    /**
     * Create a milestone for a phase
     * @param {number} phaseId
     * @param {Object} milestoneData
     * @returns {Promise<Response>}
     */
    createMilestoneForPhase: async (phaseId, milestoneData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_CREATE_ENDPOINT_FOR_PHASE(phaseId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(milestoneData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to create milestone for phase:', error);
            throw error;
        }
    },
    /**
     * Update a milestone
     * @param {number} milestoneId
     * @param {Object} milestoneData
     * @returns {Promise<Response>}
     */
    updateMilestone: async (milestoneId, milestoneData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_UPDATE_ENDPOINT(milestoneId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(milestoneData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Failed to update milestone:', error);
            throw error;
        }
    },
    /**
     * Delete a milestone
     * @param {number} milestoneId
     * @returns {Promise<Response>}
     */
    deleteMilestone: async (milestoneId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(MILESTONE_DELETE_ENDPOINT(milestoneId), {
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

            return response;

        } catch (error) {
            console.error('Failed to delete milestone:', error);
            throw error;
        }
    }
};