import { projectDetailsUpdates } from "@/data/projectsArea";
import React from "react";
import Image from "next/image";

const { id, updates } = projectDetailsUpdates;

const ProjectDetailsUpdate = ({ update = {} }) => {
  const { title, info, text, text2, image, id } = update;

  return (
    <div className="project-details-updates">
      <div className="project-details-updates-top">
        <h3 className="title">{title}</h3>
        <div className="info-updates d-block d-sm-flex justify-content-between align-items-center">
          <div className="info">
            <Image
              src={`/assets/images/${info.image}`}
              alt={info.name}
              width={300}
              height={200}
              unoptimized
              style={{ width: '100%', height: 'auto' }} 
              />
            <span>
              by{" "}
              <span>
                {info.name}
                <span> {info.date}</span>
              </span>
            </span>
          </div>
          <div className="update">
            <span>#{id} Update</span>
          </div>
        </div>
      </div>
      <div className="project-details-updates-content">
        <p>{text}</p>
        <p className="text">{text2}</p>
        <div className="project-updates-thumb mt-50">
          <Image
            src={`/assets/images/${image}`}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
};

const ProjectDetailsUpdates = ({ getClassName }) => {
  return (
    <div className={getClassName(id)} id={id}>
      {updates.map((update) => (
        <ProjectDetailsUpdate update={update} key={update.id} />
      ))}
    </div>
  );
};

export default ProjectDetailsUpdates;
