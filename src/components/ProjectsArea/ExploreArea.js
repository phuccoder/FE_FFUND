import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectService";

const ExploreArea = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await projectService.getAllProjects(page, size);
        console.log('Received projects:', response); // Log dữ liệu để kiểm tra

        // Kiểm tra nếu response chứa data hợp lệ
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          setProjects(response.data); // Lưu vào state nếu có dự án
        } else {
          setError("No projects found.");
        }
      } catch (error) {
        setError("Unable to load projects. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [page, size]);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <section className="explore-area pt-90 pb-120">
      <Container>
        <Row className="justify-content-center">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Col lg={4} md={6} sm={7} key={project.projectId}>
                <SingleProject project={project} />
              </Col>
            ))
          ) : (
            <p>No projects to display.</p>
          )}
        </Row>
      </Container>
    </section>
  );
};

export default ExploreArea;