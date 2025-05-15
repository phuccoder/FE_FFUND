import { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import ProjectPaymentPage from "@/components/Payment/ProjectPaymentPage";
import { useRouter } from "next/router";
import projectService from "../services/projectService";
import Header from "@/components/Header/Header";
import PageTitle from "@/components/Reuseable/PageTitle";

export default function Payment() {
    const router = useRouter();
    const { projectId, phaseId, milestoneId } = router.query;
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // First capture the URL parameters as soon as they are available
    useEffect(() => {
        if (router.isReady) {
            // Check if we have parameters
            if (projectId || phaseId || milestoneId) {
                console.log("Captured URL params: projectId=", projectId, "phaseId=", phaseId, "milestoneId=", milestoneId);
                
                // Save these parameters to local storage so they're available after redirects
                if (projectId) localStorage.setItem('paymentProjectId', projectId);
                if (phaseId) localStorage.setItem('paymentPhaseId', phaseId);
                if (milestoneId) localStorage.setItem('paymentMilestoneId', milestoneId);
            } else {
                console.log("No URL parameters found, checking localStorage...");
                const storedProjectId = localStorage.getItem('paymentProjectId');
                const storedPhaseId = localStorage.getItem('paymentPhaseId');
                const storedMilestoneId = localStorage.getItem('paymentMilestoneId');
                if (storedProjectId) {
                    console.log("Using stored parameters: projectId=", storedProjectId, 
                                "phaseId=", storedPhaseId, 
                                "milestoneId=", storedMilestoneId);
                }
            }
        }
    }, [router.isReady, projectId, phaseId, milestoneId]);

    // Fetch project data
    useEffect(() => {
        const fetchProjectData = async () => {
            // Use projectId from URL or fallback to localStorage
            const projectIdToUse = projectId || localStorage.getItem('paymentProjectId');

            if (!projectIdToUse) {
                return;
            }

            try {
                setLoading(true);
                console.log("Fetching project data for ID:", projectIdToUse);
                const projectData = await projectService.getProjectById(projectIdToUse);
                console.log("Project data fetched successfully:", projectData);
                setProject(projectData);
            } catch (err) {
                console.error("Failed to fetch project:", err);
                const message = err?.response?.data?.message || "Failed to load project data. Please try again.";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        // Only run when router is ready
        if (router.isReady) {
            fetchProjectData();
        }
    }, [projectId, router.isReady]);

    useEffect(() => {
        if (router.isReady) {
            // Handle phaseId
            if (projectId && phaseId) {
                localStorage.setItem('paymentPhaseId', phaseId);
            } else if (projectId && !phaseId) {
                localStorage.removeItem('paymentPhaseId');
            }

            // Handle milestoneId
            if (projectId && phaseId && milestoneId) {
                localStorage.setItem('paymentMilestoneId', milestoneId);
            } else if (projectId && phaseId && !milestoneId) {
                localStorage.removeItem('paymentMilestoneId');
            }
        }
    }, [router.isReady, projectId, phaseId, milestoneId]);

    // Show loading state during data fetching
    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3">Loading payment details...</span>
                </div>
            </Layout>
        );
    }

    // Show error if project couldn't be loaded
    if (error || !project) {
        return (
            <Layout>
                <div className="text-center p-8">
                    <h2 className="text-xl text-red-600 mb-4">{error || "Project not found"}</h2>
                    <button
                        onClick={() => router.push("/projects-1")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Return to Projects
                    </button>
                </div>
            </Layout>
        );
    }

    const phaseIdToUse = phaseId || localStorage.getItem('paymentPhaseId');
    const milestoneIdToUse = milestoneId || localStorage.getItem('paymentMilestoneId');

    return (
        <Layout>
            <Header />
            <PageTitle title="Payment" />         
            <ProjectPaymentPage
                project={project}
                selectedPhaseId={phaseIdToUse ? parseInt(phaseIdToUse) : null}
                selectedMilestoneId={milestoneIdToUse ? parseInt(milestoneIdToUse) : null}
            />
        </Layout>
    );
}