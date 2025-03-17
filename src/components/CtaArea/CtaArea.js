import { ctaArea } from "@/data/ctaArea";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Link from "../Reuseable/Link";

const { bg, title } = ctaArea;

const CtaArea = () => {
  return (
    <section className="cta-area">
      <Container>
        <Row>
          <Col lg={12}>
            <div
              className="cta-item bg_cover"
              style={{ backgroundImage: `url(${bg.src})` }}
            >
              <div className="cta-content d-block d-lg-flex justify-content-between align-items-center">
                <h3 className="title">{title}</h3>
                <Link className="main-btn main-btn-2" href="/create-project">
                  Make it happen
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default CtaArea;
