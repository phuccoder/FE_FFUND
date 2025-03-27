import { tokenManager } from "@/utils/tokenManager";
import { get } from "http";

// API endpoints
const API_BASE_URL = 'http://localhost:8080/api/v1';
const SEND_REQUEST_ENDPOINT = `${API_BASE_URL}/request`;
const UPLOAD_ATTACHMENT_ENDPOINT = `${API_BASE_URL}/request/upload-attachment/{requestId}`;
const GET_REQUESTS_BY_REQUEST_ID_ENDPOINT = `${API_BASE_URL}/request/{requestId}`;
const GET_REQUESTS_BY_USER_ENDPOINT = `${API_BASE_URL}/request/user`;

export const requestService = {
    sendRequest: async (request) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(SEND_REQUEST_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(request)
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
            console.error('Error sending request:', error);
            throw error;
        }
    },


    uploadAttachment: async (requestId, attachment) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(UPLOAD_ATTACHMENT_ENDPOINT.replace('{requestId}', requestId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: attachment
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
            console.error('Error uploading attachment:', error);
            throw error;
        }
    },

    getRequestByRequestId: async (requestId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(GET_REQUESTS_BY_REQUEST_ID_ENDPOINT.replace('{requestId}', requestId), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            console.error('Error getting request by request ID:', error);
            throw error;
        }
    },

    getRequestByUser: async () => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(GET_REQUESTS_BY_USER_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            console.error('Error getting request by user:', error);
            throw error;
        }
    }


};