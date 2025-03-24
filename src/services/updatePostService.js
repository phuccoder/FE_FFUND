const { tokenManager } = require("@/utils/tokenManager");

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1';
const UPDATE_POST_GET_BY_PROJECT = (id) => `${API_BASE_URL}/project-update-post/by-project-id/${id}`;
const UPDATE_POST_GET_BY_ID = (id) => `${API_BASE_URL}/project-update-post/${id}`;
const UPDATE_POST_CREATE = (id) =>`${API_BASE_URL}/project-update-post/${id}`; // Fixed URL formatting
const UPDATE_POST_UPLOAD_IMAGE = (id) => `${API_BASE_URL}/project-update-post/upload-image/${id}`;
const UPDATE_POST_UPDATE = (id) => `${API_BASE_URL}/project-update-post/${id}`;
const UPDATE_POST_DELETE = (id) => `${API_BASE_URL}/project-update-post/${id}`;

const updatePostService = {
    getUpdatePostByProjectId: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(UPDATE_POST_GET_BY_PROJECT(projectId), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getUpdatePostByProjectId:', error);
            throw error;
        }
    },
    getUpdatePostById: async (projectUpdatePostId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(UPDATE_POST_GET_BY_ID(projectUpdatePostId), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getUpdatePostById:', error);
            throw error;
        }
    },
    createUpdatePost: async (projectId, projectUpdatePost) => {
        try {
            const token = await tokenManager.getValidToken();
            console.log("Creating update post for project:", projectId);
            
            // Make sure we're using postContent instead of content
            const postData = {
                ...projectUpdatePost,
                postContent: projectUpdatePost.postContent || projectUpdatePost.content,
            };
            
            // Remove content if postContent exists to avoid confusion
            if (postData.postContent && postData.content) {
                delete postData.content;
            }
            
            console.log("Post data being sent:", postData);
            
            const response = await fetch(UPDATE_POST_CREATE(projectId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", errorText);
                throw new Error(`Error: ${response.status} - ${errorText || 'Unknown error'}`);
            }
            
            const data = await response.json();
            console.log("Created post response:", data);
            return data;
        }
        catch (error) {
            console.error('Error in createUpdatePost:', error);
            throw error;
        }
    },

    uploadImage: async (projectUpdatePostId, image) => {
        try {
            const token = await tokenManager.getValidToken();
            console.log("Uploading image for update post:", projectUpdatePostId);
            
            const formData = new FormData();
            formData.append('file', image);
            
            const response = await fetch(UPDATE_POST_UPLOAD_IMAGE(projectUpdatePostId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", errorText);
                throw new Error(`Error: ${response.status} - ${errorText || 'Unknown error'}`);
            }
            
            const data = await response.json();
            console.log("Image upload response:", data);
            return data;
        } catch (error) {
            console.error('Error in uploadImage:', error);
            throw error;
        }
    },
    updateUpdatePost: async (projectUpdatePostId, projectUpdatePost) => {
        try {
            const token = await tokenManager.getValidToken();
            
            // Make sure we're using postContent instead of content
            const postData = {
                ...projectUpdatePost,
                postContent: projectUpdatePost.postContent || projectUpdatePost.content,
            };
            
            // Remove content if postContent exists to avoid confusion
            if (postData.postContent && postData.content) {
                delete postData.content;
            }
            
            const response = await fetch(UPDATE_POST_UPDATE(projectUpdatePostId), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in updateUpdatePost:', error);
            throw error;
        }
    },
    deleteUpdatePost: async (projectUpdatePostId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(UPDATE_POST_DELETE(projectUpdatePostId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in deleteUpdatePost:', error);
            throw error;
        }
    }
};
export default updatePostService;