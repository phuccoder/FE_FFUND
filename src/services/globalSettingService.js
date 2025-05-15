import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quanbeo.duckdns.org/api/v1';

const GET_GLOBAL_SETTING_BY_TYPES_ENDPOINT = (types) => {
    const typesArray = Array.isArray(types) ? types : [types];
    const typesParam = typesArray.join(',');
    return `${API_BASE_URL}/settings/all/by-type?types=${typesParam}`;
};

export const globalSettingService = {
    /**
     * Get global settings by type(s)
     * @param {string|string[]} types - A single type or array of types to fetch
     * @returns {Promise<Array>} - The settings data
     */
    getGlobalSettingByType: async (types) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(GET_GLOBAL_SETTING_BY_TYPES_ENDPOINT(types), {
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
            console.error('Error fetching global settings:', error);
            throw error;
        }
    },

    /**
     * Get multiple global settings by types
     * @param {string[]} typesList - Array of types to fetch
     * @returns {Promise<Array>} - The settings data
     */
    getGlobalSettingsByTypes: async (typesList) => {
        return globalSettingService.getGlobalSettingByType(typesList);
    }
};