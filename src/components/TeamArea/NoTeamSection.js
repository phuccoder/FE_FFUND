import React from "react";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
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
            
            <Alert variant="warning" className="my-4">
              <i className="fa fa-exclamation-triangle me-2"></i>
              <strong>Important:</strong> A team is required for submitting projects to the platform. 
              You must create or join a team before you can proceed with project creation.
            </Alert>
            
            <p className="text-muted lead mb-4">
              Create a new team or wait for an invitation to join an existing team.
            </p>
            
            <div className="d-flex flex-column flex-md-row justify-content-center gap-3">
              <Link href="/team/create" passHref>
                <Button variant="primary" size="lg">
                  <i className="fa fa-plus-circle me-2"></i>
                  Create a New Team
                </Button>
              </Link>
              
              <Link href="/team/invitations" passHref>
                <Button variant="outline-primary" size="lg">
                  <i className="fa fa-envelope me-2"></i>
                  Check for Invitations
                </Button>
              </Link>
            </div>
            
            <div className="mt-4 text-muted">
              <p>Having a team allows you to:</p>
              <ul className="list-unstyled">
                <li><i className="fa fa-check-circle text-success me-2"></i>Collaborate with other members</li>
                <li><i className="fa fa-check-circle text-success me-2"></i>Submit and manage projects</li>
                <li><i className="fa fa-check-circle text-success me-2"></i>Access funding opportunities</li>
                <li><i className="fa fa-check-circle text-success me-2"></i>Distribute responsibilities</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NoTeamSection;