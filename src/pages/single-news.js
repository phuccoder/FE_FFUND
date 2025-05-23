import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import BlogDetails from "@/components/NewsArea/BlogDetails/BlogDetails";
import PageTitle from "@/components/Reuseable/PageTitle";
import React from "react";

const SingleNews = () => {
  const title = "News";
  return (
    <Layout>
      <Header />
      <PageTitle title={title} />
      <BlogDetails />
    </Layout>
  );
};

export default SingleNews;
