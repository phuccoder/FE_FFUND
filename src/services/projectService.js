import { tokenManager } from "@/utils/tokenManager";

// API endpoints
const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/category/get-all`;
const SUBCATEGORIES_ENDPOINT = `${API_BASE_URL}/sub-category/get-all`;
const PROJECT_CREATE_ENDPOINT = `${API_BASE_URL}/project`;
const CATEGORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/category/${id}`;
const SUBCATEGORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/sub-category/${id}`;
const PROJECT_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/project/get-by-id/${id}`;
const PROJECT_CREATE_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_UPDATE_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_DELETE_PHASE_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_BY_FOUNDER_ENDPOINT = `https://quanbeo.duckdns.org/api/v1/project/founder/all`;
const PROJECT_CURRENT_BY_FOUNDER_ENDPOINT = `https://quanbeo.duckdns.org/api/v1/project/founder/current`;
const PROJECT_UPDATE_BASIC_INFO_ENDPOINT = (id) => `${API_BASE_URL}/project/update-basic-information/${id}`;
const PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/project/${id}`;
const PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_FOR_GUEST_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/guest/project/${id}`;
const PROJECT_GET_FUNDING_PHASE_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_CREATE_STORY_ENDPOINT = (id) => `${API_BASE_URL}/project-story/${id}`;
const PROJECT_GET_STORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/project-story/${id}`;
const PROJECT_UPDATE_STORY_ENDPOINT = (id) => `${API_BASE_URL}/project-story/${id}`;
const PROJECT_UPLOAD_STORY_IMAGE_ENDPOINT = (id) => `${API_BASE_URL}/project-story/upload-image-to-story-block/${id}`;
const PROJECT_GET_PROJECT_STORY_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/project-story/project/${id}`;
const PROJECT_CREATE_DOCUMENT_ENDPOINT = (id) => `${API_BASE_URL}/project-document/${id}`;
const PROJECT_UPLOAD_DOCUMENT_FILE_ENDPOINT = (id) => `${API_BASE_URL}/project-document/upload-file-document/${id}`;
const PROJECT_GET_DOCUMENT_BY_PROJECT_ID_ENDPOINT = (id) => `${API_BASE_URL}/project-document/get-by-project-id/${id}`;
const PROJECT_SUBMIT_ENDPOINT = (id) => `${API_BASE_URL}/project/submit/${id}`;
const PROJECT_UPLOAD_IMAGE_ENDPOINT = (id) => `${API_BASE_URL}/project/upload-image/${id}`;
const PROJECT_GET_PHASE_RULE_ENDPOINT = (totalTargetAmount) => `${API_BASE_URL}/rule/by-total?total=${totalTargetAmount}`;
const PROJECT_GET_ALL_PHASE_RULE_ENDPOINT = `${API_BASE_URL}/rule/all`;
const PROJECT_GET_MILESTONE_BY_PHASEID_ENDPOINT = (id) => `${API_BASE_URL}/milestone/guest/phase/${id}`
const PROJECT_GET_MILESTONE_BY_PHASEID_FOR_GUEST_ENDPOINT = (id) => `${API_BASE_URL}/milestone/guest/phase/${id}`
const PROJECT_GET_INVESTMENT_BY_PHASEID_ENDPOINT = (id) => `${API_BASE_URL}/investment/all/${id}`
/**
 * Project related API service methods
 */
const projectService = {
    /**
     * Fetch all projects with pagination
     * @param {number} page - The page number (default: 1)
     * @param {number} size - The number of projects per page (default: 10)
     * @returns {Promise<Object>} Object containing project data and pagination info
     */
    getAllProjects: async (page = 0, size = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/project/search?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {
                    'accept': '*/*'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching all projects:', error);
            throw error;
        }
    },

    searchProjects: async (page = 0, size = 10, searchParams) => {
        try {
            const query = searchParams.query || '';
            const sort = searchParams.sort || '+createdAt';

            const response = await fetch(
                `${API_BASE_URL}/project/search?page=${page}&size=${size}&sort=${sort}&query=${query}`,
                {
                    method: "GET",
                    headers: {
                        "accept": "*/*",
                    }
                }
            );

            return await response.json();
        } catch (error) {
            console.error("Error fetching projects search:", error);
            throw new Error("Error fetching projects search");
        }
    },
    /**
     * Fetch all available categories
     * @returns {Promise<Array>} Array of category objects
     */
    getAllCategories: async () => {
        const token = await tokenManager.getValidToken();
        try {
            const response = await fetch(CATEGORIES_ENDPOINT, {
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

            // The issue is here - projectDescription should be explicitly included
            const payload = {
                title: projectData.title,
                // FIXED: Always include projectDescription in the payload
                projectDescription: projectData.projectDescription || projectData.shortDescription || 'Brief description of the project',
                projectLocation: projectData.location || projectData.projectLocation || '',
                isClassPotential: !!projectData.isClassPotential,
                status: projectData.status || 'DRAFT',
                projectVideoDemo: projectData.projectVideoDemo || '',
                projectUrl: projectData.projectUrl || '',
                mainSocialMediaUrl: projectData.mainSocialMediaUrl || '',
                totalTargetAmount: parseFloat(projectData.totalTargetAmount) || 1000,
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

            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
                console.log("API response for project creation:", result);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return text for non-JSON success responses (rare case)
                return responseText;
            }

            if (result && result.status === 201 && result.data) {
                console.log("New project created with ID:", result.data);
                localStorage.setItem('founderProjectId', result.data);

                return {
                    id: result.data,
                    message: result.message
                };
            }

            // If response wasn't successful, extract error message from the result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    getProjectById: async (projectId) => {
        try {
            const response = await fetch(PROJECT_BY_ID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
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

            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
                console.log("API response for project creation:", result);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                return responseText;
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
            console.error('Error creating project:', error);
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

            const responseText = await response.text();

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                return { message: "Phase updated successfully", success: true };
            }

            if (!response.ok) {
                console.error("API Error response:", result);

                if (result.status === 400 && result.error && typeof result.error === 'object') {
                    const errorMessages = Object.entries(result.error)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(errorMessages);
                }

                // Handle other error formats
                const errorMessage =
                    (result.error && typeof result.error === 'object')
                        ? Object.entries(result.error).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : result.error || result.message || `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            if (result) {
                if (result.message && result.message.includes("successfully")) {
                    return result;
                }

                if (result.status >= 200 && result.status < 300) {
                    return result;
                }
                return result;
            }
            return { message: "Phase updated successfully", success: true };
        } catch (error) {
            console.error('Error updating project phase:', error);

            if (error instanceof Error) {
                throw error;
            }

            // Handle complex error objects that might be thrown from earlier parts of the code
            if (typeof error === 'object' && error !== null) {
                if (error.status === 400 && error.error && typeof error.error === 'object') {
                    const errorMessages = Object.entries(error.error)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(errorMessages);
                }

                if (error.error && typeof error.error === 'object') {
                    const errorMessages = Object.entries(error.error)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(errorMessages);
                }

                if (error.message && typeof error.message === 'object') {
                    const errorMessages = Object.entries(error.message)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(errorMessages);
                }
            }

            // Default fallback
            throw new Error(error.message || JSON.stringify(error) || 'Unknown error');
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

            const responseText = await response.text();

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                return { success: true, message: "Phase deleted successfully" };
            }

            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

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
                throw new Error("No authentication token available");
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
                throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
            }

            // First get the response as text for debugging
            const responseText = await response.text();
            console.log("Raw API response:", responseText);

            // Then try to parse it as JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log("Parsed project data:", data);
            } catch (error) {
                console.error("Error parsing response as JSON:", error);
                throw new Error("Invalid JSON response from server");
            }

            // Check if data has a nested structure
            let projectData = data;
            if (data.data) {
                projectData = data.data;
            }

            console.log("Final project data to return:", projectData);

            // Return the data directly - caller will handle both array and single object
            return projectData;
        } catch (error) {
            console.error('Error fetching projects by founder:', error);
            throw error;
        }
    },

    getCurrentProjectByFounder: async () => {
        try {
            const token = await tokenManager.getValidToken();
            if (!token) {
                throw new Error("No authentication token available");
            }

            const response = await fetch(PROJECT_CURRENT_BY_FOUNDER_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch current projects: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log("Raw API response:", responseText);
            let data;
            try {
                data = JSON.parse(responseText);
                console.log("Parsed current project data:", data);
            } catch (error) {
                console.error("Error parsing response as JSON:", error);
                throw new Error("Invalid JSON response from server");
            }

            let projectData = data;
            if (data.data) {
                projectData = data.data;
            }
            console.log("Final project data to return:", projectData);
            // Return the data directly - caller will handle both array and single object
            return projectData;
        } catch (error) {
            console.error('Error fetching current projects by founder:', error);
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

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return the text for non-JSON success responses
                return { success: true, message: "Project info updated successfully" };
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
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
    },

    getMilestoneByPhaseId: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();
            if (!token) {
                throw new Error("No authentication token avaiable")
            }

            const response = await fetch(PROJECT_GET_MILESTONE_BY_PHASEID_ENDPOINT(phaseId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("API response for milestones:", responseData);

            // Ensure the data has the correct structure
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                return responseData.data;
            }

            // Handle unexpected response format
            console.warn("Unexpected response format from API:", responseData);
            return [];
        } catch (error) {
            console.error('Error fetching milestones for phase:', error);
            throw error;
        }
    },

    getPhasesForGuest: async (projectId) => {
        try {
            // Send GET request without authorization token for guest access
            const response = await fetch(PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_FOR_GUEST_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                }
            });

            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Parse the JSON response
            const responseData = await response.json();
            console.log("API response for guest funding phases:", responseData);

            // Ensure response structure is correct and contains phases data
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                return responseData.data;
            }

            // Return empty array if no proper data found
            console.warn("Unexpected response format from API:", responseData);
            return [];
        } catch (error) {
            console.error('Error fetching funding phases for guest:', error);
            throw error;
        }
    },

    getPhaseById: async (phaseId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_GET_FUNDING_PHASE_BY_ID_ENDPOINT(phaseId), {
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
            return result.data || result;
        } catch (error) {
            console.error(`Error fetching phase ${phaseId}:`, error);
            throw error;
        }
    },

    createProjectStory: async (projectId, storyData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_CREATE_STORY_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(storyData)
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return text for non-JSON success responses
                return responseText;
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error creating project story for project ${projectId}:`, error);
            throw error;
        }
    },

    getProjectStoryByProjectId: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_GET_PROJECT_STORY_BY_PROJECTID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse as JSON
            try {
                const data = JSON.parse(responseText);

                // If the response is a 404 error object, just return it so the component can handle it
                if (data && data.status === 404 && data.error === "Project story not found") {
                    console.log("Server returned 404: Project story not found");
                    return data; // Return the error object directly
                }

                return data;
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);

                // If we can't parse the response, check if it contains "not found" text
                if (responseText.includes("Project story not found")) {
                    return {
                        status: 404,
                        error: "Project story not found"
                    };
                }

                throw new Error(`Invalid JSON response from server: ${responseText}`);
            }
        } catch (error) {
            console.error('Error fetching project story by project ID:', error);
            throw error;
        }
    },

    getProjectStoryById: async (storyId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_GET_STORY_BY_ID_ENDPOINT(storyId), {
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
            return result.data || result;
        } catch (error) {
            console.error(`Error fetching project story ${storyId}:`, error);
            throw error;
        }
    },

    updateProjectStory: async (storyId, storyData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_UPDATE_STORY_ENDPOINT(storyId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(storyData)
            });

            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return text for non-JSON success responses
                return responseText;
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error updating project story`, error);
            throw error;
        }
    },

    uploadStoryImage: async (storyBlockId, file) => {
        try {
            console.log(`Uploading image for story ${storyBlockId}`);

            if (!storyBlockId) {
                throw new Error('No story ID provided for image upload');
            }

            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);

            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_UPLOAD_STORY_IMAGE_ENDPOINT(storyBlockId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            if (!response.ok) {
                // Try to parse the error response as JSON first
                try {
                    const errorResult = JSON.parse(responseText);
                    const errorMessage = errorResult.error ||
                        errorResult.message ||
                        errorResult.detail ||
                        `Image upload failed: ${response.status} ${response.statusText}`;

                    throw new Error(errorMessage);
                } catch (parseError) {
                    // If parsing fails, use the raw text or a fallback message
                    throw new Error(responseText || `Image upload failed: ${response.status} ${response.statusText}`);
                }
            }

            // Try to parse the success response
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Image upload successful:', result);
            } catch (parseError) {
                console.error('Error parsing success response:', parseError);
                // If the response is a plain URL string, return it directly
                if (responseText.startsWith('http')) {
                    return responseText;
                }
                throw new Error('Invalid response format from server');
            }

            // Try to find the URL in the response
            if (result && result.url) return result.url;
            if (result && result.imageUrl) return result.imageUrl;
            if (result && result.data && result.data.url) return result.data.url;
            if (result && result.data && result.data.imageUrl) return result.data.imageUrl;
            if (typeof result === 'string' && result.startsWith('http')) return result;

            console.warn('Could not determine image URL from response:', result);
            return null;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    getProjectDocumentsByProjectId: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_GET_DOCUMENT_BY_PROJECT_ID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return empty array for non-JSON success responses
                return [];
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error fetching project documents for project ${projectId}:`, error);
            throw error;
        }
    },

    createProjectDocument: async (projectId, documentData) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_CREATE_DOCUMENT_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(documentData)
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return text for non-JSON success responses
                return { success: true, message: "Document created successfully" };
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error creating project document for project ${projectId}:`, error);
            throw error;
        }
    },

    uploadDocumentFile: async (documentId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_UPLOAD_DOCUMENT_FILE_ENDPOINT(documentId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const responseText = await response.text();

            // Try to parse the response text as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `HTTP error! Status: ${response.status}`);
                }
                // Return text for non-JSON success responses
                return responseText;
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                // Extract error message from API response
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error uploading document file for document ${documentId}:`, error);
            throw error;
        }
    },

    submitProject: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_SUBMIT_ENDPOINT(projectId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Return text for non-JSON success responses
                return { success: true, message: "Project submitted successfully" };
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error submitting project ${projectId}:`, error);
            throw error;
        }
    },

    uploadProjectImage: async (projectId, file) => {
        try {
            console.log(`Uploading image for project ${projectId}`);

            if (!projectId) {
                throw new Error('No project ID provided for image upload');
            }

            if (!file) {
                throw new Error('No file provided for image upload');
            }

            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);

            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_UPLOAD_IMAGE_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing response as JSON:', parseError);
                if (!response.ok) {
                    // If we can't parse the response and it's an error, return the raw text
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // If it's a success but not JSON, it might be a direct URL or other data
                return { success: true, message: "Image uploaded successfully" };
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            console.log('Project image upload successful:', result);

            // Handle different response formats
            if (result && result.data && result.data.url) return result.data;
            if (result && result.data && result.data.imageUrl) return result.data;
            if (result && result.url) return result;
            if (result && result.imageUrl) return result;

            return result;
        } catch (error) {
            console.error(`Error uploading project image for project ${projectId}:`, error);
            throw error;
        }
    },

    getMilestoneByPhaseIdForGuest: async (phaseId) => {
        try {
            const response = await fetch(PROJECT_GET_MILESTONE_BY_PHASEID_FOR_GUEST_ENDPOINT(phaseId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();

            // Ensure the data has the correct structure
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                return responseData.data;
            }

            // Handle unexpected response format
            console.warn("Unexpected response format from API:", responseData);
            return [];
        } catch (error) {
            console.error('Error fetching milestones for phase:', error);
            throw error;
        }
    },

    getPhaseRuleByTotalTargetAmount: async (totalTargetAmount) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_GET_PHASE_RULE_ENDPOINT(totalTargetAmount), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
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
                return { success: true, message: "Phase rule retrieve successfully" };
            }

            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error getting phase rule for ${totalTargetAmount}:`, error);
            throw error;
        }
    },
    getInvestmentByPhaseId: async (phaseId, params = {}) => {
        try {
            const token = await tokenManager.getValidToken();

            // Build query string from params
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);
            if (params.sort) queryParams.append('sort', params.sort);
            if (params.query) queryParams.append('query', params.query);
            if (params.status) queryParams.append('status', params.status);

            const queryString = queryParams.toString();
            const url = `${PROJECT_GET_INVESTMENT_BY_PHASEID_ENDPOINT(phaseId)}${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
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
                return { success: true, message: "Investment retrieved successfully" };
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
            console.error(`Error getting investments for phase ${phaseId}:`, error);
            throw error;
        }
    },

    getAllPhaseRules: async () => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(PROJECT_GET_ALL_PHASE_RULE_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
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
                return { success: true, message: "Phase rules retrieved successfully" };
            }

            if (!response.ok) {
                const errorMessage = result.error ||
                    result.message ||
                    (typeof result === 'string' ? result : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            return result.data || result;
        } catch (error) {
            console.error(`Error getting all phase rules:`, error);
            throw error;
        }
    }
};

export default projectService;