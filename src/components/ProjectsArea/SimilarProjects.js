import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Title from "../Reuseable/Title";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectPublicService";
import SwiperCore, { Autoplay, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { useRouter } from "next/router";

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
    992: {
      slidesPerView: 3,
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

const SimilarProjects = ({ project }) => {
  const [similarProjects, setSimilarProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!project?.category?.name || !project?.subCategories?.length) return;

    const fetchSimilarProjects = async () => {
      setLoading(true);
      try {
        const searchParams = {
          query: `category.name:eq:${project.category.name},subCategories.subCategory.name:eq:${project.subCategories[0].name}`,
          sort: "-createdAt",
        };

        // Lưu trữ query để sử dụng cho "See more"
        setSearchQuery(encodeURIComponent(searchParams.query));

        const response = await projectService.searchProjects(0, 6, searchParams);
        let projects = response.data?.data || [];

        // Loại bỏ project hiện tại khỏi danh sách
        projects = projects.filter((proj) => proj.id !== project.id);

        // Không cần fetch phases, sử dụng currentPhase trực tiếp
        setSimilarProjects(projects);
      } catch (error) {
        console.error("Error fetching similar projects:", error);
        setSimilarProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProjects();
  }, [project]);

  const handleSeeMore = () => {
    if (project?.category?.name && project?.subCategories?.length) {
      router.push({
        pathname: "/projects-1",
        query: {
          category: project.category.name,
          subCategory: project.subCategories[0].name,
          autoSearch: true,
        },
      });
    } else {
      router.push("/projects-1");
    }
  };

  return (
    <section className="explore-projects-area explore-projects-page-area">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Title title="Similar Projects" tagline="Explore related projects" className="text-center" />
          </Col>
        </Row>
        <Row className="justify-content-center">
          {loading ? (
            <p>Loading similar projects...</p>
          ) : similarProjects.length > 1 ? (
            <Swiper {...options}>
              {similarProjects.map((proj) => (
                <SwiperSlide key={proj.id}>
                  <SingleProject project={proj} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : similarProjects.length === 1 ? (
            <Col md={6}>
              <SingleProject project={similarProjects[0]} />
            </Col>
          ) : (
            <p>No similar projects found.</p>
          )}
          <div className="text-center w-100 mt-4">
            <span
              onClick={handleSeeMore}
              className="cursor-pointer text-green-500 hover:text-green-700 text-sm font-medium"
              style={{ cursor: "pointer" }}
            >
              see more
            </span>
          </div>
        </Row>
      </Container>
    </section>
  );
};

export default SimilarProjects;