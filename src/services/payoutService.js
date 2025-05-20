import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://ffund.duckdns.org/api/v1';

const PAYOUT_GET_BY_PHASE_ENDPOINT = (phaseId) => `${API_BASE_URL}/payout/${phaseId}`;

export const payoutService = {
    getPayoutByPhase: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PAYOUT_GET_BY_PHASE_ENDPOINT(phaseId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`No payouts found for phase ${phaseId}`);
                    return null;
                }
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            
            if (!responseText || responseText.trim() === '') {
                console.log(`Empty response from API for phase ${phaseId}`);
                return null;
            }
            
            try {
                const result = JSON.parse(responseText);
                
                if (result && result.data) {
                    return result;
                }
                
                if (result && result.error) {
                    throw new Error(result.error);
                }
                
                return { data: result };
                
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                return null;
            }
        } catch (error) {
            console.error('Failed to get payout by phase:', error);
            if (error.message && error.message.includes('not found')) {
                return null;
            }
            throw error;
        }
    }
};