import React from "react";
import { Col } from "react-bootstrap";
import Link from "../Reuseable/Link";
import Image from "next/image";

const NewsItem = ({ news = {}, index = 0, newsTwo = false }) => {
  const { image, date, admin, comments, title, image2 } = news;
  const newImage = newsTwo && image2 ? image2 : image;
  const isEven = (index + 1) % 2 === 0;

  const imagePath = `/assets/images/${newImage}`;

  return (
    <Col lg={newsTwo ? 4 : 3} md={newsTwo ? 7 : 6}>
      <div
        className={`news-item mt-30${
          !newsTwo && isEven ? " d-flex flex-column flex-md-column-reverse" : ""
        }`}
      >
        <div className="news-thumb" style={{ position: 'relative', minHeight: '200px' }}>
          <img
            src={imagePath}
            alt={title}
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        </div>
        <div className="news-content">
          <span>{date}</span>
          <ul>
            <li>
              <i className="fa fa-user-circle"></i> {admin}
            </li>
            <li>
              <i className="fa fa-comments-o"></i> {comments} Comments
            </li>
          </ul>
          <h3 className="title">{title}</h3>
          <Link href="/single-news">
            <i className="flaticon-next"></i>
          </Link>
        </div>
      </div>
    </Col>
  );
};

export default NewsItem;