import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";

const ProjectDetailsArea = ({ project }) => {
  if (!project) {
    return <div>Loading project data...</div>;
  }

  const { title, projectImage, projectUrl, status, category, subCategories, mainSocialMediaUrl, description } = project;

  const raised = 5000;
  const goal = 10000;
  const backers = 150;
  const daysLeft = 10;
  const categoryName = category ? category.name : "Uncategorized";
  const raisedPercentage = (raised / goal) * 100 || 0;
  return (
    <section className="project-details-area pt-120 pb-190">
      <Container>
        <Row>
          <Col lg={7}>
            <div className="project-details-thumb">
              <div className="image-container" style={{ textAlign: "center" }}>
                <Image src={projectImage} alt={title} width={600} height={600} style={{ maxWidth: "100%", height: "auto" }} />
              </div>
              <div className="icon">
                <i className="fa fa-heart"></i>
              </div>
            </div>
          </Col>
          <Col lg={5}>
            <div className="project-details-content">
              <div className="details-btn">
                <span>{status}</span>
                <div className="flag">
                  <p>{categoryName}</p>
                </div>
              </div>
              <h3 className="title">{title}</h3>
              {description && <p className="description">{description}</p>}
              <div className="project-details-item">
                <div className="item text-center">
                  <h5 className="title">${raised}</h5>
                  <span>Pledged</span>
                </div>
                <div className="item text-center">
                  <h5 className="title">{backers}</h5>
                  <span>Backers</span>
                </div>
                <div className="item text-center">
                  <h5 className="title">{daysLeft}</h5>
                  <span>Days Left</span>
                </div>
              </div>
              <div className="projects-range">
                <div className="projects-range-content">
                  <ul>
                    <li>Raised:</li>
                    <li>{raisedPercentage}%</li>
                  </ul>
                  <div className="range"></div>
                </div>
              </div>
              <div className="projects-goal">
                <span>
                  Goal: <span>{goal} USD</span>
                </span>
              </div>
              <div className="project-btn mt-25">
                <a className="main-btn" href={projectUrl} target="_blank" rel="noopener noreferrer">
                  Back this project
                </a>
              </div>
              <div className="project-share d-flex align-items-center">
                <span>Share this Project</span>
                <ul>
                  <li>
                    <a href={mainSocialMediaUrl}>
                      <i className="fa fa-facebook"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ProjectDetailsArea;
