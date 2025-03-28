import { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import ProjectPaymentPage from "@/components/Payment/ProjectPaymentPage";
import { useRouter } from "next/router";

import projectService from "../services/projectService";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header/Header";
import PageTitle from "@/components/Reuseable/PageTitle";

export default function Payment() {
    const router = useRouter();
    const { projectId, phaseId } = router.query;
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // First capture the URL parameters as soon as they are available
useEffect(() => {
    if (router.isReady) {
      // Check if we have parameters
      if (projectId || phaseId) {
        console.log("Captured URL params: projectId=", projectId, "phaseId=", phaseId);
        
        // Save these parameters to local storage so they're available after auth redirects
        if (projectId) localStorage.setItem('paymentProjectId', projectId);
        if (phaseId) localStorage.setItem('paymentPhaseId', phaseId);
      } else {
        console.log("No URL parameters found, checking localStorage...");
        const storedProjectId = localStorage.getItem('paymentProjectId');
        const storedPhaseId = localStorage.getItem('paymentPhaseId');
        if (storedProjectId) {
          console.log("Using stored parameters: projectId=", storedProjectId, "phaseId=", storedPhaseId);
        }
      }
    }
  }, [router.isReady, projectId, phaseId]);

    // Then handle authentication
    useEffect(() => {
        if (authLoading) return; // Wait for auth to load

        if (!isAuthenticated) {
            // Store the current URL to redirect back after login
            const returnUrl = window.location.pathname + window.location.search;
            localStorage.setItem('returnUrl', returnUrl);
            console.log("User not authenticated, redirecting to login with returnUrl:", returnUrl);
            router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
            return;
        }

        if (user && user.role !== 'INVESTOR') {
            console.log("User is not an investor, redirecting to unauthorized");
            router.push('/unauthorized');
            return;
        }

        console.log("User authenticated as investor, proceeding with payment flow");
    }, [isAuthenticated, user, authLoading, router]);

    // Finally fetch project data if authenticated
    useEffect(() => {
        const fetchProjectData = async () => {
            // Use projectId from URL or fallback to localStorage
            const projectIdToUse = projectId || localStorage.getItem('paymentProjectId');

            if (!projectIdToUse || authLoading || !isAuthenticated || (user && user.role !== 'INVESTOR')) {
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
                setError("Failed to load project data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        // Only run when router is ready and auth is complete
        if (router.isReady && !authLoading) {
            fetchProjectData();
        }
    }, [projectId, router.isReady, isAuthenticated, authLoading, user]);

    useEffect(() => {
        if (router.isReady && projectId && phaseId) {
          // Store the phaseId in localStorage for persistence if needed
          localStorage.setItem('paymentPhaseId', phaseId);
        } else if (router.isReady && projectId && !phaseId) {
          // If there's no phaseId in the URL, remove it from localStorage to ensure proper flow
          localStorage.removeItem('paymentPhaseId');
        }
      }, [router.isReady, projectId, phaseId]);

    // Show loading state during authentication or data fetching
    if (authLoading || (loading && isAuthenticated && user?.role === 'INVESTOR')) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3">Loading payment details...</span>
                </div>
            </Layout>
        );
    }

    // Skip rendering if redirecting due to auth issues
    if (!authLoading && (!isAuthenticated || (user && user.role !== 'INVESTOR'))) {
        return <div className="hidden">Redirecting...</div>; // This won't be shown as useEffect will redirect
    }

    // Show error if project couldn't be loaded
    if (error || (!loading && !project)) {
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

    return (
        <Layout>
            <Header />
            <PageTitle title="Payment" />
            <ProjectPaymentPage
                project={project}
                selectedPhaseId={phaseIdToUse ? parseInt(phaseIdToUse) : null}
            />
        </Layout>
    );
}