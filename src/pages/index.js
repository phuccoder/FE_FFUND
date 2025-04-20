import BannerSlider from "@/components/BannerSlider/BannerSlider";
import BrandArea from "@/components/BrandArea/BrandArea";
import Categories from "@/components/Categories/Categories";
import CtaArea from "@/components/CtaArea/CtaArea";
import FunFacts from "@/components/FunFacts/FunFacts";
import GuideArea from "@/components/GuideArea/GuideArea";
import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import NewsArea from "@/components/NewsArea/NewsArea";
import ProjectsArea from "@/components/ProjectsArea/ProjectsArea";
import SuperstarsArea from "@/components/SuperstarsArea/SuperstarsArea";
import TeamArea from "@/components/TeamArea/TeamArea";
import TeamMainArea from "@/components/TeamArea/TeamMainArea";
import TestimonialsArea from "@/components/Testimonials/TestimonialsArea";
import TogetherArea from "@/components/TogetherArea/TogetherArea";
import WhyChoose from "@/components/WhyChoose/WhyChoose";
import React from "react";

const Home = () => {
  return (
    <Layout>
      <Header />
      <BannerSlider />
      <ProjectsArea />
      <WhyChoose />
      <FunFacts />
      <BrandArea />
      <TestimonialsArea />
      <TeamMainArea />
    </Layout>
  );
};

export default Home;
