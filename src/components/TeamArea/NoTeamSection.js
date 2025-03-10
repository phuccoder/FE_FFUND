import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Link from "next/link";

const NoTeamSection = () => {
  return (
    <div className="no-team-section py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} className="text-center">
            <div className="mb-4">
              <i className="fa fa-users fa-4x text-primary"></i>
            </div>
            <h2>You&apos;re Not Part of Any Team Yet</h2>
            <p className="text-muted lead mb-4">
              Create a new team or wait for an invitation to join an existing team.
            </p>
            <Link href="/team/create" passHref>
              <Button variant="primary" size="lg">
                <i className="fa fa-plus-circle me-2"></i>
                Create a New Team
              </Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NoTeamSection;