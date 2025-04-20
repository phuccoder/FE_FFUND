// API endpoints
const API_BASE_URL = 'http://localhost:8080/api/v1'; // Replace with your actual API base URL
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/category/get-all`;
const SUBCATEGORIES_ENDPOINT = `${API_BASE_URL}/sub-category/get-all`;
const CATEGORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/category/${id}`;
const SUBCATEGORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/sub-category/${id}`;
const PROJECT_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/project/get-by-id/${id}`;
const PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_FOR_GUEST_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/guest/project/${id}`;
const PROJECT_GET_PROJECT_STORY_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/project-story/project/story-public/${id}`;
const PROJECT_GET_UPDATE_POST_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/project-update-post/by-project-id/${id}`;
//Milestone
const PROJECT_GET_MILESTONE_BY_PHASEID_ENDPOINT = (id) => `${API_BASE_URL}/milestone/guest/phase/${id}`
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
    
            const result = await response.json();

            if (!result || !result.data || !Array.isArray(result.data.data)) {
                return [];
            }
    
            return result.data.data || [];
        } catch (error) {
            console.error('Error fetching all projects:', error);
            throw error;
        }
    },
    searchProjects: async (page = 0, size = 10, searchParams) => {
        try {
            const query = searchParams.query;
            const sort = searchParams.sort || '+createdAt';
    
            const response = await fetch(
                `${API_BASE_URL}/project/search?page=${page}&size=${size}&sort=${sort}&query=${query}`,
                {
                    method: "GET",
                    headers: {
                        "accept": "*/*",
                    },
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

    getUpdatePostByProjectId : async (projectId) => {
        try {
            const response = await fetch(PROJECT_GET_UPDATE_POST_BY_PROJECTID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("Received update posts data:", result);
    
            return result.data || result;
        } catch (error) {
            console.error(`Error fetching update posts for project ${projectId}:`, error);
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

            return result.data || result;
        } catch (error) {
            console.error(`Error fetching project ${projectId}:`, error);
            throw error;
        }
    },
    
    getMilestoneByPhaseId: async (phaseId) => {
        try{

            const response = await fetch(PROJECT_GET_MILESTONE_BY_PHASEID_ENDPOINT(phaseId), {
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

            // Ensure response structure is correct and contains phases data
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                return responseData.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching funding phases for guest:', error);
            throw error;
        }
    },

    getProjectStoryByProjectIdForGuest: async (projectId) => {
        try {
            
            const response = await fetch(PROJECT_GET_PROJECT_STORY_BY_PROJECTID_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
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
};

export default projectService;