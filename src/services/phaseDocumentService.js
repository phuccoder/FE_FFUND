import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';

const PHASE_DOCUMENT_GET_BY_PHASE_ENDPOINT = (phaseId) => `${API_BASE_URL}/phase-document/submitted/${phaseId}`;
const PHASE_DOCUMENT_GET_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/phase-document/submitted/${id}`;
const PHASE_DOCUMENT_CREATE_ENDPOINT = (phaseId) => `${API_BASE_URL}/phase-document/${phaseId}`;
const PHASE_DOCUMENT_UPDATE_ENDPOINT = (id) => `${API_BASE_URL}/phase-document/${id}`;
const PHASE_DOCUMENT_GET_BY_FOUNDER_ENDPOINT = (phaseId) => `${API_BASE_URL}/phase-document/founder/${phaseId}`;

export const phaseDocumentService = {
    getPhaseDocumentByPhase: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PHASE_DOCUMENT_GET_BY_PHASE_ENDPOINT(phaseId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch phase document by phase.");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getPhaseDocumentByPhase:', error);
            throw error;
        }
    },

    getPhaseDocumentById: async (id) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PHASE_DOCUMENT_GET_BY_ID_ENDPOINT(id), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch phase document by ID.");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getPhaseDocumentById:', error);
            throw error;
        }
    },

    createPhaseDocument: async (phaseId, formData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PHASE_DOCUMENT_CREATE_ENDPOINT(phaseId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create phase document.");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in createPhaseDocument:', error);
            throw error;
        }
    },

    updatePhaseDocument: async (id, formData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PHASE_DOCUMENT_UPDATE_ENDPOINT(id), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update phase document.");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in updatePhaseDocument:', error);
            throw error;
        }
    },

    getPhaseDocumentByFounder: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PHASE_DOCUMENT_GET_BY_FOUNDER_ENDPOINT(phaseId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch phase document by founder.");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getPhaseDocumentByFounder:', error);
            throw error;
        }
    }
};

    


