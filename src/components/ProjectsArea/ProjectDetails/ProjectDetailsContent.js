import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ProjectDetailsComments from "./ProjectDetailsComments";
import ProjectDetailsFaq from "./ProjectDetailsFaq";
import ProjectDetailsSidebar from "./ProjectDetailsSidebar";
import ProjectDetailsStory from "./ProjectDetailsStory";
import ProjectDetailsUpdates from "./ProjectDetailsUpdates";
import { projectDetailsTabBtns } from "@/data/projectsArea";
import { likeCommentProjectService } from "../../../services/likeCommentProjectService";
import updatePostService  from "../../../services/updatePostService";

const ProjectDetailsContent = ({ project }) => {
  const [current, setCurrent] = useState("pills-home");
  const [commentCount, setCommentCount] = useState(0); // State để lưu số lượng comment
  const [updatePostCount, setUpdatePostCount] = useState(0); // State để lưu số lượng update post

  // Gọi API để lấy commentCount và updatePostCount
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (project) {
        try {
          const response = await likeCommentProjectService.getCountLikesComments(project.id);
          if (response.status === 200) {
            setCommentCount(response.data.commentCount); // Lưu commentCount từ API
          }
        } catch (error) {
          console.error("Error fetching comment count:", error);
        }
      }
    };

    const fetchUpdatePostCount = async () => {
      if (project) {
        try {
          const response = await updatePostService.getCountUpdatePost(project.id);
          if (response.status === 200) {
            setUpdatePostCount(response.data); // Lưu updatePostCount từ API
          }
        } catch (error) {
          console.error("Error fetching update post count:", error);
        }
      }
    };

    fetchCommentCount();
    fetchUpdatePostCount();
  }, [project]);

  const getClassName = (id = "") => {
    const active = current === id;
    return `tab-pane animated${active ? " fadeIn show active" : ""}`;
  };

  return (
    <section className="project-details-content-area pb-110">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="tab-btns">
              <ul className="nav nav-pills" id="pills-tab" role="tablist">
                {projectDetailsTabBtns.map(({ id, name }) => (
                  <li key={id} className="nav-item" role="presentation">
                    <a
                      onClick={() => setCurrent(id)}
                      className={`nav-link cursor-pointer${id === current ? " active" : ""}`}
                      role="tab"
                    >
                      {id === "pills-4" ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {name}
                          <span className="count-circle">({commentCount})</span>
                        </span>
                      ) : id === "pills-contact" ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {name}
                          <span className="count-circle">({updatePostCount})</span>
                        </span>
                      ) : (
                        name
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tab-content" id="pills-tabContent">
              <ProjectDetailsStory getClassName={getClassName} project={project} />
              <ProjectDetailsFaq getClassName={getClassName} project={project} />
              <ProjectDetailsUpdates getClassName={getClassName} project={project} />
              <ProjectDetailsComments getClassName={getClassName} project={project} />
            </div>
          </Col>
          <Col lg={4} md={7} sm={9}>
            <ProjectDetailsSidebar project={project} />
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ProjectDetailsContent;