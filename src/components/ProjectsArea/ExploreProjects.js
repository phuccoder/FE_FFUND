import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SwiperCore, { Autoplay, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Title from "../Reuseable/Title";
import SingleExploreProject from "./SingleExploreProject";
import projectService from "../../services/projectService";

SwiperCore.use([Autoplay, Pagination]);

const options = {
  slidesPerView: 2,
  spaceBetween: 30,
  loop: true,
  autoplay: {
    delay: 3000,
  },
  pagination: {
    clickable: true,
  },
  breakpoints: {
    768: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
    0: {
      slidesPerView: 1,
      spaceBetween: 0,
    },
  },
};

const ExploreProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = {
          query: "",
          sort: "+createdAt",
        };
        const response = await projectService.searchProjects(0, 5, searchParams);
        setProjects(response.data || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section className="explore-projects-3-area">
      <Container fluid className="p-0">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Title title="Explore Projects" tagline="Discover amazing projects" className="text-center" />
          </Col>
        </Row>
        <div className="explore-project-2-active">
          {loading ? (
            <p>Loading projects...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <Swiper {...options}>
              <div className="swiper-wrapper">
                {projects.map((project) => (
                  <SwiperSlide key={project.id}>
                    <SingleExploreProject project={project} />
                  </SwiperSlide>
                ))}
              </div>
            </Swiper>
          )}
        </div>
      </Container>
    </section>
  );
};

export default ExploreProjects;