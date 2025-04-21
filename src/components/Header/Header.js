import headerData from "@/data/headerData";
import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import MainHeaderItem from "./MainHeaderItem";
import Social from "./Social";

const { logo, navItems, phone, icon, email, address, socials } = headerData;

const Header = ({ className = "" }) => {
  // Add the missing scrollTop state
  const [scrollTop, setScrollTop] = useState(false);
  
  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY > 100);
    };
    
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`header-area ${className}`}>
      <Container>
        <Row>
          <Col lg={12}>
            <div className="header-top d-flex justify-content-between align-items-center">
              <div className="header-info">
                <ul>
                  <li>
                    <a href={`mailto:${email}`}>
                      <i className="flaticon-email"></i> {email}
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <i className="flaticon-placeholder"></i> {address}
                    </a>
                  </li>
                </ul>
              </div>
              <Social socials={socials} />
            </div>
          </Col>
        </Row>
      </Container>
      <div className={`main-header${scrollTop ? " sticky" : ""}`} style={{ zIndex: 40 }}>
        <Container>
          <MainHeaderItem
            logo={logo}
            navItems={navItems}
            icon={icon}
            phone={phone}
          />
        </Container>
      </div>
    </header>
  );
};

export default Header;