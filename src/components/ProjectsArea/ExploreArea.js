import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectService";

const ExploreArea = ({ searchParams }) => {
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
        let response;
        
        if (searchParams && searchParams.query) {
          response = await projectService.getAllProjects(page, size, searchParams);
        } else {
          response = await projectService.getAllProjects(page, size);
        }

        console.log('Received projects:', response);

        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          setProjects(response.data);
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
  }, [page, size, searchParams]);

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
