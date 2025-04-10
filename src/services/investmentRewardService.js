import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';


export const investmentRewardService = {
    getInvestmentRewardByProjectId: async (page = 0, size = 10, searchParams) => {
        const query = searchParams.query;
        const sort = searchParams.sort || '+createdAt';

        const token = await tokenManager.getValidToken();
        const response = await fetch(`${API_BASE_URL}/investment/founder/investments-have-reward?page=${page}&size=${size}&sort=${sort}&query=${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch investment rewards: ${response.statusText}`);
        }

        return response.json();
    },

    confirmShippingItem: async (shippingId) => {
        const token = await tokenManager.getValidToken();
        const response = await fetch(`${API_BASE_URL}/shipping-information/confirm-shipping/${shippingId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to confirm shipping item: ${response.statusText}`);
        }

        return response.json();
    },

    getFundingPhaseByFounder: async () => {
        const token = await tokenManager.getValidToken();
        const response = await fetch(`${API_BASE_URL}/funding-phase/founder`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch funding phase: ${response.statusText}`);
        }

        return response.json();
    }
}
