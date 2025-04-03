import React, { useEffect, useState } from 'react';
import { Col, Row, Card, Modal, Button } from "react-bootstrap";
import { getTeamMemberDetail } from '../../../services/teamService';

const ProjectTeam = ({ getClassName, project }) => {
  const { teamName, teamDescription, teamMembers } = project?.team;
  const [membersDetails, setMembersDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      const details = [];
      for (const member of teamMembers) {
        try {
          const detail = await getTeamMemberDetail(member.memberId);
          details.push(detail);
        } catch (error) {
          console.error(`Error fetching details for member ${member.memberId}`, error);
          details.push(null);
        }
      }
      setMembersDetails(details);
    };

    if (teamMembers && teamMembers.length > 0) {
      fetchMemberDetails();
    }
  }, [teamMembers]);

  const handleShowModal = (memberIndex) => {
    setSelectedMember(membersDetails[memberIndex]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className={`${getClassName?.("pills-profile")} p-6 bg-white shadow-lg rounded-lg`} id="pills-profile" role="tabpanel">
      {/* Team Name and Description */}
      <div className="mb-6">
        <h3 className="text-3xl font-semibold text-orange-500">{teamName}</h3>
        <p className="text-lg text-gray-700 mt-2">{teamDescription}</p>
      </div>

      {/* Team Members Section */}
      <h4 className="text-2xl font-semibold text-green-600 mb-4">
        Team Members
      </h4>
      <Row className="g-6">
        {teamMembers.map((member, index) => (
          <Col key={index} sm={12} md={6} lg={4}>
            <Card
              className="h-full bg-white shadow-xl rounded-lg p-4 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
              onClick={() => handleShowModal(index)}
            >
              <Card.Body className="flex flex-col items-center text-center">
                {/* Member Avatar */}
                <img
                  src={member.memberAvatar}
                  alt={member.memberName}
                  className="w-28 h-28 object-cover rounded-full mb-4 border-4 border-orange-500 shadow-lg"
                />
                {/* Member Name */}
                <Card.Title className="text-lg font-semibold text-gray-800">{member.memberName}</Card.Title>
                {/* Member Email */}
                <Card.Subtitle className="text-sm text-gray-500 mb-2">{member.memberEmail}</Card.Subtitle>
                {/* Member Role */}
                <Card.Text className="text-gray-700">
                  {member.teamRole ? member.teamRole : "MEMBER"}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal for Detailed Info */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="bg-green-600 text-white">
          <Modal.Title className="text-xl font-semibold">Team Member Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-gray-50">
          {selectedMember ? (
            <div className="space-y-4">
              {/* Display Avatar above the table */}
              <div className="flex justify-center mb-4">
                <img
                  src={selectedMember.userAvatar} // Display avatar of the selected member
                  alt={selectedMember.fullName}
                  className="w-32 h-32 object-cover rounded-full border-4 border-orange-500"
                />
              </div>

              {/* Table for member details */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <tbody className="bg-white">
                    <tr>
                      <td className="px-6 py-3 font-semibold text-black">Full Name</td>
                      <td className="px-6 py-3">{selectedMember.fullName}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-semibold text-black">Email</td>
                      <td className="px-6 py-3">{selectedMember.email}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-semibold text-black">FFund Profile</td>
                      <td className="px-6 py-3">
                        <a href={selectedMember.userFfundLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                          View Profile
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-semibold text-black">Student Class</td>
                      <td className="px-6 py-3">{selectedMember.studentClass}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-semibold text-black">EXE Class</td>
                      <td className="px-6 py-3">{selectedMember.exeClass}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 font-semibold text-black">Facility</td>
                      <td className="px-6 py-3">{selectedMember.fptFacility}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading detailed info...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} className="bg-orange-500 hover:bg-orange-600 text-white">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProjectTeam;
