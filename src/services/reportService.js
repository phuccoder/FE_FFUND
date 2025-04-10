import { tokenManager } from "@/utils/tokenManager";

const API_BASE_URL = 'https://quanbeo.duckdns.org/api/v1'; // Replace with your actual API base URL
const SUBMIT_REPORT_ENDPOINT = (projectId, type) => `${API_BASE_URL}/report-project/${projectId}?type=${type}`;
const UPLOAD_ATTACHMENT_ENDPOINT = (reportId) => `${API_BASE_URL}/report-project/upload/${reportId}`;
const GET_REPORT_BY_USER_ENDPOINT = `${API_BASE_URL}/report-project/user`;
const GET_REPORT_BY_PROJECT_ENDPOINT = (projectId) => `${API_BASE_URL}/report-project/${projectId}`;

export const reportService = {
    // Submit a report for a project
    async submitReport(projectId, type, reportData) {
        const token = await tokenManager.getValidToken();
        const response = await fetch(SUBMIT_REPORT_ENDPOINT(projectId, type), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            throw new Error(`Failed to submit report: ${response.statusText}`);
        }

        return response.json();
    },

    // Upload an attachment for a report
    async uploadAttachment(reportId, file) {
        const token = await tokenManager.getValidToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(UPLOAD_ATTACHMENT_ENDPOINT(reportId), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload attachment: ${response.statusText}`);
        }

        return response.json();
    },

    // Get reports submitted by the current user
    async getReportsByUser() {
        const token = await tokenManager.getValidToken();
        const response = await fetch(GET_REPORT_BY_USER_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user reports: ${response.statusText}`);
        }

        return response.json();
    },

    // Get reports for a specific project
    async getReportsByProject(projectId) {
        const token = await tokenManager.getValidToken();
        const response = await fetch(GET_REPORT_BY_PROJECT_ENDPOINT(projectId), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch project reports: ${response.statusText}`);
        }

        return response.json();
    },
};