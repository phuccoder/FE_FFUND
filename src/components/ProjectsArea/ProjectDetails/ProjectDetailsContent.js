import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ProjectDetailsComments from "./ProjectDetailsComments";
import ProjectDetailsFaq from "./ProjectDetailsFaq";
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

  console.log("Project Data in ProjectDetailsContent:", project);
  
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
