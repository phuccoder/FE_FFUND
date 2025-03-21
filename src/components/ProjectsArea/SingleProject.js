import React from "react";
import Link from "../Reuseable/Link";

const SingleProject = ({ project = {} }) => {
  const {
    projectTitle,
    createdAt,
    subCategories,
    projectUrl,
  } = project;

  const category = subCategories && subCategories.length > 0 ? subCategories[0].subCategoryName : "Uncategorized";
  const date = createdAt ? new Date(createdAt).toLocaleDateString() : "Unknown Date";
  const title = projectTitle || "Untitled Project";

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
        <Link href="/single-project">
          <h3 className="title">{title}</h3>
        </Link>
        <div className="projects-range">
          <div className="projects-range-content">
            <ul>
              <li>Raised:</li>
              <li>0%</li> {/* Placeholder for raised amount */}
            </ul>
            <div className="range"></div>
          </div>
        </div>
        <div className="projects-goal">
          <span>
            Goal: <span>Unknown USD</span> {/* Placeholder for goal */}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SingleProject;
