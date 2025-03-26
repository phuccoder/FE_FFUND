import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import ExploreArea from "@/components/ProjectsArea/ExploreArea";
import PageTitle from "@/components/Reuseable/PageTitle";
import AdvancedSearch from "@/components/ProjectsArea/AdvancedSearch";
import React, { useState } from "react";

const Projects = () => {
  const [searchParams, setSearchParams] = useState(null);

  const handleSearch = (params) => {
    console.log("Search parameters in Projects page:", params);
    setSearchParams(params);
  };

  return (
    <Layout>
      <Header />
      <PageTitle title="Explore" />
      <AdvancedSearch onSearch={handleSearch} />
      <ExploreArea searchParams={searchParams} />
    </Layout>
  );
};

export default Projects;