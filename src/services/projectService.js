import { tokenManager } from "@/utils/tokenManager";

// API endpoints
const API_BASE_URL = 'http://localhost:8080/api/v1';
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/category/get-all`;
const SUBCATEGORIES_ENDPOINT = `${API_BASE_URL}/sub-category/get-all`;
const PROJECT_CREATE_ENDPOINT = `${API_BASE_URL}/project`;
const CATEGORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/category/${id}`;
const SUBCATEGORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/sub-category/${id}`;
const PROJECT_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/project/get-by-id/${id}`;
const PROJECT_CREATE_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_UPDATE_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_DELETE_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_BY_FOUNDER_ENDPOINT = `http://localhost:8080/api/v1/project/founder`;
const PROJECT_UPDATE_BASIC_INFO_ENDPOINT = (id) => `${API_BASE_URL}/project/update-basic-information/${id}`;
const PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/project/${id}`;
const PROJECT_GET_FUNDING_PHASE_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;

/**
 * Project related API service methods
 */
const projectService = {
    /**
     * Fetch all available categories
     * @returns {Promise<Array>} Array of category objects
     */
    getAllCategories: async () => {
        try {
            const response = await fetch(CATEGORIES_ENDPOINT);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 200) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    /**
     * Fetch a specific category by ID
     * @param {number} categoryId - The category ID to fetch
     * @returns {Promise<Object>} Category object with subcategories
     */
    getCategoryById: async (categoryId) => {
        try {
            const response = await fetch(CATEGORY_BY_ID_ENDPOINT(categoryId));

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 200) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching category ${categoryId}:`, error);
            throw error;
        }
    },

    /**
     * Fetch all available subcategories
     * @returns {Promise<Array>} Array of subcategory objects
     */
    getAllSubcategories: async () => {
        try {
            const response = await fetch(SUBCATEGORIES_ENDPOINT);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 200) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            throw error;
        }
    },

    /**
     * Fetch a specific subcategory by ID
     * @param {number} subcategoryId - The subcategory ID to fetch
     * @returns {Promise<Object>} Subcategory object
     */
    getSubcategoryById: async (subcategoryId) => {
        try {
            const response = await fetch(SUBCATEGORY_BY_ID_ENDPOINT(subcategoryId));

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 200) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching subcategory ${subcategoryId}:`, error);
            throw error;
        }
    },

    /**
     * Create a new project
     * @param {Object} projectData - Project data to submit
     * @returns {Promise<Object>} Created project data or error
     */
    /**
   * Create a new project
   * @param {Object} projectData - Project data to submit
   * @returns {Promise<Object>} Created project data or error
   */
    createProject: async (projectData) => {
        try {
            console.log("Creating project with data:", projectData);

            const payload = {
                projectTitle: projectData.title,
                // Map shortDescription to projectDescription
                projectDescription: projectData.shortDescription,
                // Map location to projectLocation
                projectLocation: projectData.location,
                isClassPotential: !!projectData.isClassPotential,
                projectStatus: 'DRAFT',
                projectVideoDemo: projectData.projectVideoDemo || '',
                projectUrl: projectData.projectUrl || '',
                mainSocialMediaUrl: projectData.mainSocialMediaUrl || '',
                categoryId: parseInt(projectData.categoryId),
                subCategoryIds: projectData.subCategoryIds.map(id => parseInt(id))
            };

            console.log("Sending project payload to API:", payload);

            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_CREATE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("API response for project creation:", result);

            // Check for HTTP error responses
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! Status: ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    getProjectById: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();

            const response = await fetch(PROJECT_BY_ID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Received project data:", result);

            return result.data || result;
        } catch (error) {
            console.error(`Error fetching project ${projectId}:`, error);
            throw error;
        }
    },

    createProjectPhase: async (projectId, phaseData) => {
        try {
            const token = await tokenManager.getValidToken();

            const response = await fetch(PROJECT_CREATE_PHASE_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(phaseData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Phase created successfully:", result);

            return result.data || result;
        } catch (error) {
            console.error(`Error creating project phase for project ${projectId}:`, error);
            throw error;
        }
    },

    updateProjectPhase: async (phaseId, phaseData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_UPDATE_PHASE_ENDPOINT(phaseId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(phaseData)
            });

            const result = await response.json();

            // Check for HTTP error responses first
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! Status: ${response.status}`);
            }

            // Handle successful status codes (2xx) with different response formats
            if (result) {
                // If the API includes a message like "Phase updated successfully", consider it a success
                if (result.message && result.message.includes("successfully")) {
                    return result;
                }

                // Also accept explicit success status in response body
                if (result.status >= 200 && result.status < 300) {
                    return result;
                }

                // If we got here with a 2xx HTTP status but no explicit success indicators,
                // assume it's still a success and return the result
                return result;
            }

            // This should rarely happen - 2xx HTTP status but no response body
            return { message: "Phase updated successfully" };
        } catch (error) {
            console.error('Error updating project phase:', error);
            throw error;
        }
    },

    deleteProjectPhase: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();

            const response = await fetch(PROJECT_DELETE_PHASE_ENDPOINT(phaseId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Phase deleted successfully:", result);

            return result.data || result;
        } catch (error) {
            console.error(`Error deleting phase ${phaseId}:`, error);
            throw error;
        }
    },

    getProjectsByFounder: async () => {
        try {
            const token = await tokenManager.getValidToken();
            if (!token) {
                console.error("No valid token found when fetching founder projects");
                throw new Error('Authentication token required');
            }

            console.log("Fetching projects with token:", token.substring(0, 10) + "...");

            const response = await fetch(PROJECT_BY_FOUNDER_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("API response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error ${response.status}:`, errorText);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // First get the response as text for debugging
            const responseText = await response.text();
            console.log("Raw API response:", responseText);

            // Then try to parse it as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                console.error("Error parsing JSON:", error);
                throw new Error("Invalid JSON response from API");
            }

            console.log("Parsed project data:", data);

            // Return the data directly - caller will handle both array and single object
            return data.data || data;
        } catch (error) {
            console.error('Error fetching projects by founder:', error);
            throw error;
        }
    },

    updateProjectInfo: async (projectId, projectData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_UPDATE_BASIC_INFO_ENDPOINT(projectId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectData)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! Status: ${response.status}`);
            }
            return result;
        } catch (error) {
            console.error('Error updating project info:', error);
            throw error;
        }
    },

    // Add or update this method to handle the response structure
    getPhaseByProject: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            if (!token) {
                console.error("No valid token found when fetching phases");
                throw new Error('Authentication token required');
            }

            const response = await fetch(PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("API response for phases:", responseData);

            // Extract the phases array from the response
            // The API appears to return { status: 200, data: [...phases], message: "..." }
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                return responseData.data;
            }

            // Return the raw data if it's already an array
            if (Array.isArray(responseData)) {
                return responseData;
            }

            // Return empty array if no proper data found
            console.warn("Unexpected response format from API:", responseData);
            return [];
        } catch (error) {
            console.error('Error fetching phases by project:', error);
            throw error;
        }
    }

};

export default projectService;