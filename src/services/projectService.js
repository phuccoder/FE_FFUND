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
const PROJECT_BY_FOUNDER_ENDPOINT = `https://quanbeo.duckdns.org/api/v1/project/founder`;
const PROJECT_UPDATE_BASIC_INFO_ENDPOINT = (id) => `${API_BASE_URL}/project/update-basic-information/${id}`;
const PROJECT_GET_FUNDING_PHASES_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/project/${id}`;
const PROJECT_GET_FUNDING_PHASE_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/funding-phase/${id}`;
const PROJECT_CREATE_STORY_ENDPOINT = (id) => `${API_BASE_URL}/project-story/${id}`;
const PROJECT_GET_STORY_BY_ID_ENDPOINT = (id) => `${API_BASE_URL}/project-story/${id}`;
const PROJECT_UPDATE_STORY_ENDPOINT = (id) => `${API_BASE_URL}/project-story/${id}`;
const PROJECT_UPLOAD_STORY_IMAGE_ENDPOINT = (id) => `${API_BASE_URL}/project-story/upload-image-to-story-block/${id}`;
const PROJECT_GET_PROJECT_STORY_BY_PROJECTID_ENDPOINT = (id) => `${API_BASE_URL}/project-story/project/${id}`;


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
    getAllProjects: async (page = 1, size = 10) => {
        try {
            console.log(`Fetching projects with page: ${page} and size: ${size}`);
    
            const response = await fetch(`${API_BASE_URL}/project/get-all?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {
                    'accept': '*/*'
                }
            });
    
            if (!response.ok) {
                console.error(`Error: Received a non-OK status ${response.status} from API`);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("Received all projects:", result);
    
            if (!result || !result.data) {
                console.warn("No data found in the response or data is empty.");
            }
    
            return result.data || [];
        } catch (error) {
            console.error('Error fetching all projects:', error);
            throw error;
        }
    },  
    searchProjects: async (page = 1, size = 10, searchParams) => {
        try {
          const query = searchParams.query;
          const response = await fetch(
            `https://quanbeo.duckdns.org/api/v1/project/search?page=${page}&size=${size}&sort=${searchParams.sort}&query=${query}`,
            {
              method: "GET",
              headers: {
                "accept": "*/*",
              },
            }
          );
          return await response.json();
        } catch (error) {
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

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
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
            if (response.status === 401) {
                return null;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error(`Error fetching project story for project ${projectId}:`, error);
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

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error(`Error updating project story ${storyId}:`, error);
            throw error;
        }
    },
    // Method to upload an image to a story
    uploadStoryImage: async (storyBlockId, file) => {
        try {
            console.log(`Uploading image for story ${storyBlockId}`);

            // Fixed: storyId is undefined error - using storyBlockId instead
            if (!storyBlockId) {
                throw new Error('No story ID provided for image upload');
            }

            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('accessToken');
            const response = await fetch(PROJECT_UPLOAD_STORY_IMAGE_ENDPOINT(storyBlockId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                console.error(`Image upload failed with status: ${response.status}`);
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to upload image');
            }

            const result = await response.json();
            console.log('Image upload successful:', result);

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
    }
};

export default projectService;