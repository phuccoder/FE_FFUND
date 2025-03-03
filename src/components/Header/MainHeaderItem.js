import React from "react";
import { Col, Row } from "react-bootstrap";
import Link from "../Reuseable/Link";
import HeaderInfo from "./HeaderInfo";
import HeaderMenu from "./HeaderMenu";
import Image from "next/image";

const MainHeaderItem = ({
  logo,
  navItems = [],
  icon,
  phone = "",
  socials,
  searchColor,
}) => {
  return (
    <Row>
      <Col lg={12}>
        <div className="main-header-item">
          <div className="main-header-menus d-flex justify-content-between align-items-center">
            <div className="header-logo">
              <Link href="/">
                <Image src='/assets/images/logo.jpg' alt="logo" width={150} height={75} />
              </Link>
            </div>
            <HeaderMenu navItems={navItems} />
            <HeaderInfo
              icon={icon}
              phone={phone}
              socials={socials}
              searchColor={searchColor}
            />
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default MainHeaderItem;
