import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://ffund.duckdns.org/api/v1';
const SHIPPING_INFORMATION_GET_BY_INVESMENT_ID_ENDPOINT = (id) => `${API_BASE_URL}/shipping-information/${id}`;
const SHIPPING_INFORMATION_CREATE_ENDPOINT = (investmentId, userAddressId) => `${API_BASE_URL}/shipping-information/${investmentId}/${userAddressId}`;
const SHIPPING_INFORMATION_UPDATE_ENDPOINT = (id, userAddressId) => `${API_BASE_URL}/shipping-information/${id}/${userAddressId}`;
const SHIPPING_INFORMATION_CONFIRM_SHIPPING_ENDPOINT = (id) => `${API_BASE_URL}/shipping-information/confirm-shipping/${id}`;
const SHIPPING_INFORMATION_CONFIRM_RECEIVED_ENDPOINT = (id) => `${API_BASE_URL}/shipping-information/confirm-received/${id}`;

export const shippingInformationService = {
    async getShippingInformationById(id) {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(SHIPPING_INFORMATION_GET_BY_INVESMENT_ID_ENDPOINT(id), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getShippingInformationById:', error);
            throw error;
        }
    },
    async createShippingInformation(investmentId, userAddressId) {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(SHIPPING_INFORMATION_CREATE_ENDPOINT(investmentId, userAddressId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error in createShippingInformation:', error);
            throw error;
        }
    },
    async updateShippingInformation(id, userAddressId) {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(SHIPPING_INFORMATION_UPDATE_ENDPOINT(id, userAddressId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in updateShippingInformation:', error);
            throw error;
        }
    },

    async confirmShipping(id) {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(SHIPPING_INFORMATION_CONFIRM_SHIPPING_ENDPOINT(id), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in confirmShipping:', error);
            throw error;
        }
    },

    async confirmReceived(id) {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(SHIPPING_INFORMATION_CONFIRM_RECEIVED_ENDPOINT(id), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in confirmReceived:', error);
            throw error;
        }
    },
};