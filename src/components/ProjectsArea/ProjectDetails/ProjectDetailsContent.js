import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ProjectDetailsComments from "./ProjectDetailsComments";
import ProjectTeam from "./ProjectTeam";
import ProjectDetailsSidebar from "./ProjectDetailsSidebar";
import ProjectDetailsStory from "./ProjectDetailsStory";
import ProjectDetailsUpdates from "./ProjectDetailsUpdates";
import { projectDetailsTabBtns } from "@/data/projectsArea";

const ProjectDetailsContent = ({ project }) => {
  const [current, setCurrent] = useState("pills-home");

  const getClassName = (id = "") => {
    const active = current === id;
    return `tab-pane animated${active ? " fadeIn show active" : ""}`;
  };

  // Determine if the current tab should be full width
  const isFullWidthTab = current === "pills-home" || current === "pills-phase";
  
  return (
    <section className="project-details-content-area pb-110">
      {/* Navigation tabs - always centered */}
      <Container className="mb-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="tab-btns">
              <ul className="nav nav-pills" id="pills-tab" role="tablist">
                {projectDetailsTabBtns.map(({ id, name }) => (
                  <li key={id} className="nav-item" role="presentation">
                    <a
                      onClick={() => setCurrent(id)}
                      className={`nav-link cursor-pointer${
                        id === current ? " active" : ""
                      }`}
                      role="tab"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Content container - conditionally fluid */}
      <Container fluid={isFullWidthTab}>
        <Row className="justify-content-center">
          <Col lg={isFullWidthTab ? 12 : 8}>
            {/* Tab content */}
            <div className="tab-content" id="pills-tabContent">
              <div className={getClassName("pills-home")} id="pills-home">
                <ProjectDetailsStory getClassName={getClassName} project={project} />
              </div>
              <div className={getClassName("pills-profile")} id="pills-profile">
                <ProjectTeam getClassName={getClassName} project={project} />
              </div>
              <div className={getClassName("pills-contact")} id="pills-contact">
                <ProjectDetailsUpdates getClassName={getClassName} project={project} />
              </div>
              <div className={getClassName("pills-4")} id="pills-comments">
                <ProjectDetailsComments getClassName={getClassName} project={project} />
              </div>
              <div className={getClassName("pills-phase")} id="pills-phase">
                <ProjectDetailsSidebar getClassName={getClassName} project={project} />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ProjectDetailsContent;