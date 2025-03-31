import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'http://localhost:8080/api/v1';
const LIKE_PROJECT_ENDPOINT = (projectId) => `${API_BASE_URL}/like-comment-project/like/${projectId}`;
const UNLIKE_PROJECT_ENDPOINT = (projectId) => `${API_BASE_URL}/like-comment-project/unlike/${projectId}`;
const COMMENT_PROJECT_ENDPOINT = (projectId) => `${API_BASE_URL}/like-comment-project/comment/${projectId}`;
const REPLY_COMMENT_ENDPOINT = (projectId, parentCommentId) => `${API_BASE_URL}/like-comment-project/comment/${projectId}?parentCommentId=${parentCommentId}`;
const GET_COMMENTS_ENDPOINT = (projectId, page, size) => `${API_BASE_URL}/like-comment-project/comments/${projectId}?page=${page}&size=${size}`;
const GET_COUNT_LIKES_COMMENTS_ENDPOINT = (projectId) => `${API_BASE_URL}/like-comment-project/like-comment-count/${projectId}`;
const UPDATE_COMMENT_ENDPOINT = (commentId) => `${API_BASE_URL}/like-comment-project/comment/${commentId}`;
const DELETE_COMMENT_ENDPOINT = (commentId) => `${API_BASE_URL}/like-comment-project/comment/${commentId}`;
const GET_REPLIES_ENDPOINT = (commentId, page, size) => `${API_BASE_URL}/like-comment-project/reply-comment/${commentId}?page=${page}&size=${size}`;
const GET_IS_LIKED_ENDPOINT = (projectId) => `${API_BASE_URL}/like-comment-project/is-liked/${projectId}`;

export const likeCommentProjectService = {
    likeProject: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(LIKE_PROJECT_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error liking project:', error);
            throw error;
        }
    },

    unlikeProject: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(UNLIKE_PROJECT_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error unliking project:', error);
            throw error;
        }
    },

    commentProject: async (projectId, comment) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(COMMENT_PROJECT_ENDPOINT(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(comment)
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error commenting project:', error);
            throw error;
        }
    },

    replyComment: async (projectId, parentCommentId, comment) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(REPLY_COMMENT_ENDPOINT(projectId, parentCommentId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(comment)
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error replying to comment:', error);
            throw error;
        }
    },

    getProjectComments: async (projectId, page, size) => {
        try {
            const response = await fetch(GET_COMMENTS_ENDPOINT(projectId, page, size), {
                method: 'GET',
                headers: {
                    'accept': '*/*'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching project comments:', error);
            throw error;
        }
    },

    getCountLikesComments: async (projectId) => {
        try {
            const response = await fetch(GET_COUNT_LIKES_COMMENTS_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching comment likes count:', error);
            throw error;
        }
    },

    updateComment: async (commentId, comment) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(UPDATE_COMMENT_ENDPOINT(commentId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(comment)
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    },

    deleteComment: async (commentId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(DELETE_COMMENT_ENDPOINT(commentId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    },

    getCommentReplies: async (commentId, page, size) => {
        try {
            const response = await fetch(GET_REPLIES_ENDPOINT(commentId, page, size), {
                method: 'GET',
                headers: {
                    'accept': '*/*'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching comment replies:', error);
            throw error;
        }
    },

    getIsLiked: async (projectId) => {
        try {
            const token = await tokenManager.getValidToken();
            const response = await fetch(GET_IS_LIKED_ENDPOINT(projectId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed with status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error checking if project is liked:', error);
            throw error;
        }
    }

};

