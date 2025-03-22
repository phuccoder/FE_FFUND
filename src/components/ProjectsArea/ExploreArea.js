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
  
        // Kiểm tra searchParams và thực hiện tìm kiếm
        if (searchParams && searchParams.query) {
          response = await projectService.getAllProjects(page, size, searchParams);
        } else {
          // Lấy tất cả các dự án nếu không có tham số tìm kiếm
          response = await projectService.getAllProjects(page, size);
        }
  
        console.log('Received projects:', response);
  
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          setProjects(response.data);  // Cập nhật state với dữ liệu trả về từ API
        } else {
          setError("No projects found.");  // Nếu không có kết quả, hiển thị thông báo lỗi
          setProjects([]);  // Đảm bảo mảng projects là rỗng
        }
      } catch (error) {
        setError("Unable to load projects. Please try again later.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProjects();
  }, [page, size, searchParams]);  // Lắng nghe sự thay đổi của searchParams
  
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
