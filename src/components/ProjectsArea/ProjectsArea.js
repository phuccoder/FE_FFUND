import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SwiperCore, { Autoplay, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Title from "../Reuseable/Title";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectService";

SwiperCore.use([Autoplay, Pagination]);

const options = {
  slidesPerView: 3,
  spaceBetween: 30,
  loop: true,
  autoplay: {
    delay: 3000,
  },
  pagination: {
    clickable: true,
  },
  breakpoints: {
    1200: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
    992: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
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

const ProjectsArea = ({ className = "" }) => {
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
        const response = await projectService.searchProjects(0, 4, searchParams);
        console.log("API Response:", response); // Kiểm tra dữ liệu trả về từ API
        setProjects(response.data.data || []); // Truy cập đúng mảng dự án
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
    <section className={`explore-projects-area ${className}`}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Title tagline="Businesses You Can Back" title="Explore Projects" className="text-center" />
          </Col>
        </Row>
        <div className="explore-project-active">
          {loading ? (
            <p>Loading projects...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <Swiper {...options}>
              <div className="swiper-wrapper">
                {projects.map((project) => (
                  <SwiperSlide key={project.id}>
                    <SingleProject project={project} />
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

export default ProjectsArea;