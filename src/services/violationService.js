
const API_BASE_URL = 'https://ffund.duckdns.org/api/v1';

const GET_VIOLATION_BY_FOUNDER_ENDPOINT = (projectId) => `${API_BASE_URL}/violation/founder/${projectId}`;

export const violationService = {
    getViolationByFounder: async (projectId) => {
        try {
            if (!projectId) {
                return [];
            }
            const token = await tokenManager.getValidToken();
            const response = await fetch(GET_VIOLATION_BY_FOUNDER_ENDPOINT(projectId), {
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
            console.error('Error fetching violations:', error);
            throw error;
        }
    },
};