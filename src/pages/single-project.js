import { useEffect, useState } from "react";
import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import ProjectDetailsArea from "@/components/ProjectsArea/ProjectDetails/ProjectDetailsArea";
import ProjectDetailsContent from "@/components/ProjectsArea/ProjectDetails/ProjectDetailsContent";
import SimilarProjects from "@/components/ProjectsArea/SimilarProjects";
import PageTitle from "@/components/Reuseable/PageTitle";
import projectService from "../services/projectPublicService";

const SingleProject = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <SimilarProjects project={project} />
    </Layout>
  );
};

export default SingleProject;
