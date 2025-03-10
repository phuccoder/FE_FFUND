import React from "react";
import Image from "next/image";

const PortfolioItem = ({ portfolio = {}, className = "" }) => {
  const { image, title } = portfolio;
  return (
    <div className={`portfolio-item${className}`}>
      <Image 
        src={`/assets/images/${image}`} 
        alt={title} 
        unoptimized
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="portfolio-overlay">
        <a className="image-popup">
          <i className="flaticon-add"></i>
        </a>
      </div>
    </div>
  );
};

export default PortfolioItem;