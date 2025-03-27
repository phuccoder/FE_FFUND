import React from 'react';
import { Col, Row, Card } from "react-bootstrap";

const ProjectTeam = ({ getClassName, project }) => {
  // Extract team information from the project prop
  const { teamName, teamDescription, teamMembers } = project?.team;

  return (
    <div className={`${getClassName?.("pills-profile")} p-6 bg-white shadow-md rounded-lg`} id="pills-profile" role="tabpanel">
      {/* Team Name and Description */}
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-blue-600">{teamName}</h3>
        <p className="text-lg text-gray-600 mt-2">{teamDescription}</p>
      </div>

      {/* Team Members Section */}
      <h4 className="text-xl font-semibold text-blue-600 mb-4">Team Members</h4>
      <Row className="g-4">
        {teamMembers.map((member, index) => (
          <Col key={index} sm={12} md={6} lg={4}>
            <Card className="h-full bg-white shadow-md rounded-lg p-4">
              <Card.Body className="flex flex-col items-center text-center">
                {/* Member Avatar */}
                <img
                  src={member.memberAvatar}
                  alt={member.memberName}
                  className="w-24 h-24 object-cover rounded-full mb-4 border-2 border-blue-600"
                />
                {/* Member Name */}
                <Card.Title className="text-lg font-semibold text-gray-800">{member.memberName}</Card.Title>
                {/* Member Email */}
                <Card.Subtitle className="text-sm text-gray-500 mb-2">{member.memberEmail}</Card.Subtitle>
                {/* Member Role */}
                <Card.Text className="text-gray-700">{member.teamRole}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default ProjectTeam;
