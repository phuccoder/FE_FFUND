import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const TRANSACTION_GET_BY_INVESTOR_ENDPOINT = (page, size, sort) => `${API_BASE_URL}/investment/user?page=${page}&size=${size}&sort=${sort}`;
const TRANSACTION_GET_BY_FOUNDER_ENDPOINT = `${API_BASE_URL}/transactions`;

const buildUrl = (baseUrl, params) => {
    const url = new URL(baseUrl);

    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });

    return url.toString();
};


const buildQueryString = (filters) => {
    if (!filters || typeof filters !== 'object') return '';

    const queryParts = [];

    if (filters.investorName) {
        queryParts.push(`investment.user.fullName:eq:${filters.investorName}`);
    }

    if (filters.projectTitle) {
        queryParts.push(`project.title:eq:${filters.projectTitle}`);
    }

    return queryParts.join(',');
};

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
    },

    getTransactionsByFounder: async (page = 0, size = 10, sort = '', filters = {}) => {
        try {
            const token = await tokenManager.getValidToken();
            const query = buildQueryString(filters);

            const url = buildUrl(TRANSACTION_GET_BY_FOUNDER_ENDPOINT, {
                page,
                size,
                sort: sort || undefined,
                query: query || undefined
            });

            console.log('Fetching from URL:', url);

            const response = await fetch(url, {
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
            console.error('Error fetching founder transactions:', error);
            throw error;
        }
    },

    getTransactionStatistics: async (projectId = null) => {
        try {
            const token = await tokenManager.getValidToken();

            const url = buildUrl(`${API_BASE_URL}/transactions/statistic`, {
                projectId: projectId || undefined,
            });

            console.log('Fetching transaction statistics from URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', response.status, errorText);
                throw new Error(`Failed to fetch transaction statistics: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();

            return responseData.data || {};
        } catch (error) {
            console.error('Error fetching transaction statistics:', error);
            throw error;
        }
    },
};