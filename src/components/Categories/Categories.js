import React from "react";
import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";

const Categories = ({ tagline, title, text }) => {
  return (
    <section
      className="categories-area bg_cover"
      style={{ backgroundImage: `url(/assets/images/categories-bg.jpg)` }}
    >
      <Container>
        <Row className="align-items-center">
          <Col lg={5}>
            <div className="categories-content">
              <span>{tagline}</span>
              <h3 className="title">{title}</h3>
              <p>{text}</p>
              <div className="item d-flex align-items-center">
                <div className="thumb">
                  <Image 
                    src="/assets/images/categories-user.jpg"
                    alt="categories user"
                    unoptimized
                  />
                </div>
                <Image 
                  src="/assets/images/sign-in.jpg"
                  alt="sign in"
                  unoptimized
                />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Categories;