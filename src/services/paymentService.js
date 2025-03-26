const { tokenManager } = require("@/utils/tokenManager");

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const PAYMENT_INFO_GET_BY_PHASE_ENDPOINT = (id, page, size, sort) => `${API_BASE_URL}/investment/all/${id}?page=${page}&size=${size}&sort=${sort}`;
const PAYMENT_INFO_GET_BY_USER_ENDPOINT = (page, size, sort) => `${API_BASE_URL}/investment/user?page=${page}&size=${size}&sort=${sort}`;
const PAYMENT_INFO_GET_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/investment/${id}`;
const PAYMENT_INFO_CREATE_FOR_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/investment/phase/${id}`;
const PAYMENT_INFO_CREATE_FOR_MILESTONE_ENDPOINT = (id) => `${API_BASE_URL}/investment/milestone/${id}`;

const paymentInformationService = {
    getPaymentInfoByPhase: async (id, page, size, sort) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PAYMENT_INFO_GET_BY_PHASE_ENDPOINT(id, page, size, sort), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
            } catch (error) {
                console.error('Error in getPaymentInfoByPhase:', error);
                throw error;
            }
    },

    getPaymentInfoByUser: async (page, size, sort) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PAYMENT_INFO_GET_BY_USER_ENDPOINT(page, size, sort), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
            } catch (error) {
                console.error('Error in getPaymentInfoByUser:', error);
                throw error;
            }
    },

    getPaymentInfoById: async (id) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PAYMENT_INFO_GET_BY_ID_ENDPOINT(id), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
            } catch (error) {
                console.error('Error in getPaymentInfoById:', error);
                throw error;
            }
    },

    createPaymentInfoForPhase: async (id, paymentInfo) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PAYMENT_INFO_CREATE_FOR_PHASE_ENDPOINT(id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(paymentInfo),
            });
            const data = await response.json();
            return data;
            } catch (error) {
                console.error('Error in createPaymentInfoForPhase:', error);
                throw error;
            }
    },

    createPaymentInfoForMilestone: async (id, paymentInfo) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PAYMENT_INFO_CREATE_FOR_MILESTONE_ENDPOINT(id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(paymentInfo),
            });
            const data = await response.json();
            return data;
            } catch (error) {
                console.error('Error in createPaymentInfoForMilestone:', error);
                throw error;
            }
    },
};

export default paymentInformationService;