import { tokenManager } from '@/utils/tokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ffund.duckdns.org/api/v1';

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

            const responseText = await response.text();

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

            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result;
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            throw error;
        }
    },

    getCurrentEvaluation: async (projectId) => {
        if (!projectId) {
            return null;
        }

        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(`${API_BASE_URL}/evaluation/latest-graded/${projectId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            const responseText = await response.text();

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

            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result;
        } catch (error) {
            console.error('Error fetching current evaluation:', error);
            throw error;
        }
    },
};