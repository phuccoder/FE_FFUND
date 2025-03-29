import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const TRANSACTION_GET_BY_INVESTOR_ENDPOINT = (page, size, sort) => `${API_BASE_URL}/investment/user?page=${page}&size=${size}&sort=${sort}`;

export const transactionService = {
    getTransactionsByInvestor: async (page = 0, size = 10, sort = '') => {
        try {
            const token = await tokenManager.getValidToken();
            
            const response = await fetch(TRANSACTION_GET_BY_INVESTOR_ENDPOINT(page, size, sort), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', response.status, errorText);
                throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
            }
            
            const responseData = await response.json();
            
            if (responseData && responseData.data) {
                return {
                    content: responseData.data.data || [],
                    totalPages: responseData.data.totalPages || 1,
                    currentPage: responseData.data.currentPage || 0,
                    pageSize: responseData.data.pageSize || 10,
                    totalElements: responseData.data.totalElements || 0
                };
            }

            return {
                content: [],
                totalPages: 1,
                currentPage: 0,
                pageSize: 10,
                totalElements: 0
            };
        } catch (error) {
            console.error('Error fetching investor transactions:', error);
            throw error;
        }
    }
};