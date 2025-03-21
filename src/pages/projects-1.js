import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import ExploreArea from "@/components/ProjectsArea/ExploreArea";
import PageTitle from "@/components/Reuseable/PageTitle";
import AdvancedSearch from "@/components/ProjectsArea/AdvancedSearch";  // Import component AdvancedSearch
import React, { useState } from "react";

const Projects = () => {
  const [searchParams, setSearchParams] = useState(null);

  const handleSearch = (params) => {
    setSearchParams(params);  // Update search parameters based on user input
    console.log("Search parameters: ", params);  // Log the search parameters for testing
  };

  return (
    <Layout>
      <Header />
      <PageTitle title="Explore" />
      <AdvancedSearch onSearch={handleSearch} /> {/* Add AdvancedSearch component */}
      <ExploreArea searchParams={searchParams} />  {/* Pass searchParams to ExploreArea */}
    </Layout>
  );
};

export default Projects;
