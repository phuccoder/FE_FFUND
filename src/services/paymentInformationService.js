/**
 * Service for handling project payment information and Stripe Connect integration
 */
const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';

import { tokenManager } from '@/utils/tokenManager';

export const paymentInfoService = {
    /**
     * Create a Stripe Connect onboarding link for a project
     * @param {string} projectId - The project ID to create payment info for
     * @returns {Promise<Object>} The response containing the onboarding URL
     */
    createOnboardingLink: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(`${API_BASE_URL}/project-payment-information/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            // Handle empty responses
            if (response.status === 204) {
                return { success: true };
            }

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status} ${response.statusText}`);
                }
                return { success: true, message: "Operation completed successfully" };
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed with status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
                }
            }

            // Try to parse JSON, but handle cases where it might not be JSON
            try {
                const result = await response.json();
                return result;
            } catch (jsonError) {
                console.warn("Response wasn't valid JSON, returning success");
                return { success: true };
            }
        } catch (error) {
            console.error('Error creating Stripe onboarding link:', error);
            throw error;
        }
    },

    updateOnboardingLink: async (paymentId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(`${API_BASE_URL}/project-payment-information/${paymentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (response.status === 204) {
                return { success: true };
            }

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status} ${response.statusText}`);
                }
                return { success: true, message: "Operation completed successfully" };
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed with status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
                }
            }

            // Try to parse JSON, but handle cases where it might not be JSON
            try {
                const result = await response.json();
                return result;
            } catch (jsonError) {
                console.warn("Response wasn't valid JSON, returning success");
                return { success: true };
            }
        } catch (error) {
            console.error('Error creating Stripe onboarding link:', error);
            throw error;
        }
    },

    /**
     * Verify the onboarded Stripe account and update status
     * @param {string} paymentInfoId - The payment info ID to verify
     * @returns {Promise<Object>} The response with updated payment info status
     */
    verifyOnboarding: async (paymentInfoId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(`${API_BASE_URL}/payment/onboard/callback/${paymentInfoId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            // Handle empty and non-JSON responses
            if (response.status === 204) {
                return { success: true };
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed with status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
                }
            }

            // Try to parse JSON, but handle cases where it might not be JSON
            try {
                return await response.json();
            } catch (jsonError) {
                console.warn("Response wasn't valid JSON, returning success");
                return { success: true };
            }
        } catch (error) {
            console.error('Error verifying Stripe onboarding:', error);
            throw error;
        }
    },

    /**
   * Refresh an expired onboarding link
   * @param {string} paymentInfoId - The payment info ID to refresh
   * @returns {Promise<Object>} The response containing the new onboarding URL
   */
    refreshOnboardingLink: async (paymentInfoId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(`${API_BASE_URL}/payment/onboard/refresh/${paymentInfoId}`, {
                method: 'POST', // Make sure this matches what your backend expects
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            // Special handling for 403 - might mean the account is already complete
            if (response.status === 403) {
                console.warn("Refresh endpoint returned 403. This might indicate the account is already connected.");
                // Instead of treating this as an error, return a success indicator
                return {
                    success: true,
                    message: "Account may already be verified. The refresh link is not needed."
                };
            }

            // Handle empty and non-JSON responses
            if (response.status === 204) {
                return { success: true };
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed with status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
                }
            }

            // Try to parse JSON, but handle cases where it might not be JSON
            try {
                return await response.json();
            } catch (jsonError) {
                console.warn("Response wasn't valid JSON, returning success");
                return { success: true };
            }
        } catch (error) {
            console.error('Error refreshing Stripe onboarding link:', error);
            throw error;
        }
    },

    /**
     * Get payment information for a project
     * @param {string} projectId - The project ID
     * @returns {Promise<Object>} The payment information
     */
    getPaymentInfo: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();

            // Check if projectId is valid
            if (!projectId) {
                console.warn("No project ID provided for getPaymentInfo");
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/project-payment-information/by-project-id/${projectId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 404) {
                return null; // No payment info exists yet
            }

            // Handle 403 Forbidden as a special case
            if (response.status === 403) {
                console.warn("Access forbidden for payment info. This could be due to permissions or authentication issues.");
                return null;
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed with status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
                }
            }

            // Try to parse JSON, but handle cases where it might not be JSON
            try {
                const result = await response.json();
                return result.data || result;
            } catch (jsonError) {
                console.warn("Response wasn't valid JSON");
                return null;
            }
        } catch (error) {
            console.error('Error fetching payment information:', error);
            // Return null instead of throwing to make component more resilient
            return null;
        }
    }
};