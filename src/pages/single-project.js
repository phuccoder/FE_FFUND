import { useEffect, useState } from "react";
import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import ProjectDetailsArea from "@/components/ProjectsArea/ProjectDetails/ProjectDetailsArea";
import ProjectDetailsContent from "@/components/ProjectsArea/ProjectDetails/ProjectDetailsContent";
import SimilarProjects from "@/components/ProjectsArea/SimilarProjects";
import PageTitle from "@/components/Reuseable/PageTitle";
import projectService from "../services/projectPublicService";
import ReportProjectForm from "@/components/Report/reportProjectForm";
import { ToastContainer } from "react-toastify";

const SingleProject = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      const projectId = localStorage.getItem("selectedProjectId");
      if (!projectId) {
        setError("No project selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await projectService.getProjectById(projectId);
        setProject(data);
      } catch (error) {
        setError("Failed to fetch project details.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();

    const handleStorageChange = () => {
      loadProject();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleReportForm = () => {
    setShowReportForm(!showReportForm);
    // Reset success state when toggling form
    if (reportSuccess) {
      setReportSuccess(false);
    }
  };

  const handleReportSuccess = (response) => {
    setReportSuccess(true);
    // Hide form after a delay
    setTimeout(() => {
      setShowReportForm(false);
      setReportSuccess(false);
    }, 3000);
  };

  if (loading) {
    return <div>Loading project details...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!project) {
    return <div>No project found.</div>;
  }

  return (
    <Layout>
      <Header />
      <PageTitle title="Single Project" page="Explore" />
      <ProjectDetailsArea project={project} />
      <ProjectDetailsContent project={project} />

      <div className="px-4 ml-0">
        {/* Report Button */}
        <div className="mt-8 mb-4 flex justify-start">
          <button
            onClick={toggleReportForm}
            className="bg-white hover:bg-gray-100 text-black font-normal py-3 px-6 rounded-lg border border-black shadow-sm flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {showReportForm ? "Cancel Report" : "Report this Project to FFUND"}
          </button>
        </div>

        {/* Success Message */}
        {reportSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Report submitted successfully. Thank you for your feedback.
          </div>
        )}

        {/* Inline Report Form */}
        {showReportForm && !reportSuccess && (
          <ReportProjectForm
            projectId={project.id}
            onClose={toggleReportForm}
            onSuccess={handleReportSuccess}
          />
        )}
      </div>


      <SimilarProjects project={project} />
    </Layout>
  );
};

export default SingleProject;