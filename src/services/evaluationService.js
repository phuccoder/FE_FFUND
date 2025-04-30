import { tokenManager } from '@/utils/tokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quanbeo.duckdns.org/api/v1';

const GET_EVALUATION_BY_FOUNDER_ENDPOINT = (projectId) => `${API_BASE_URL}/evaluation/founder/${projectId}`;

export const evaluationService = {
    getEvaluationByFounder: async (projectId) => {
        if (!projectId) {
            return [];
        }
        
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(GET_EVALUATION_BY_FOUNDER_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 200) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching evaluation data:', error);
            throw error;
        }
    }
};