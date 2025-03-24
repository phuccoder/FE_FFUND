import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const SingleProject = ({ project = {} }) => {
  const { id, title, createdAt, subCategories, projectUrl } = project;
  
  const category = project.category ? project.category.name : "Uncategorized"; 
  const date = createdAt ? new Date(createdAt).toLocaleDateString() : "Unknown Date";
  
  const projectTitle = title || "Untitled Project";

  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("selectedProjectId", id);
    router.push("/single-project");
  };

  return (
    <div className="explore-projects-item mt-30">
      <div className="explore-projects-thumb">
        <a href={projectUrl} target="_blank" rel="noopener noreferrer">
          <i className="fa fa-heart"></i>
        </a>
      </div>
      <div className="explore-projects-content">
        <div className="item d-flex align-items-center">
          <span>{category}</span>
          <p>
            <i className="fa fa-clock-o"></i> {date}
          </p>
        </div>
        <h3 className="title" onClick={handleClick}>{projectTitle}</h3>
        <div className="projects-range">
          <div className="projects-range-content">
            <ul>
              <li>Raised:</li>
              <li>0%</li>
            </ul>
            <div className="range"></div>
          </div>
        </div>
        <div className="projects-goal">
          <span>
            Goal: <span>Unknown USD</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SingleProject;
