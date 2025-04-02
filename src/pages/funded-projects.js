import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import ExploreProjectsThree from "@/components/ProjectsArea/ExploreProjectsThree";
import PageTitle from "@/components/Reuseable/PageTitle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import React from "react";

const ProjectsPage = () => {
  return (
    <Layout>
      <Header />
      <PageTitle title="My Invested Projects" />
      <ExploreProjectsThree />
    </Layout>
  );
};

const Projects2 = () => {
  return (
    <ProtectedRoute requiredRoles={['INVESTOR']}>
      <ProjectsPage />
    </ProtectedRoute>
  );
};

export default Projects2;