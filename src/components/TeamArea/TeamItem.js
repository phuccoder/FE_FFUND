import Image from "next/image";
import React from "react";
import { Col  } from "react-bootstrap";


const TeamItem = ({ team = {} }) => {
  const { image, socials, name, tagline, title } = team;

  return (
    <Col lg={4} md={7}>
      <div className="team-item mt-30">
        <div className="team-thumb">
          <Image
           src={`/assets/images/${image}`}
           alt={title} 
           width={300}  
           height={200} 
           unoptimized
           style={{ width: '100%', height: 'auto' }}
          />
          <div className="share">
            <i className="fa fa-share-alt"></i>
            <ul>
              {socials.map(({ id, icon, href }) => (
                <li key={id}>
                  <a href={href}>
                    <i className={icon}></i>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="team-content text-center">
          <h5 className="title">{name}</h5>
          <span>{tagline}</span>
        </div>
      </div>
    </Col>
  );
};

export default TeamItem;
