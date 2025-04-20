import React, { useEffect, useState } from 'react';
import { Col, Row, Card, Modal, Button } from "react-bootstrap";
import { getTeamMemberDetail } from '../../../services/teamService';

const ProjectTeam = ({ getClassName, project }) => {
  const { teamName, teamDescription, teamMembers } = project?.team;
  const [membersDetails, setMembersDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loadingMember, setLoadingMember] = useState(false);

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

  const handleShowModal = async (memberIndex) => {
    try {
      setLoadingMember(true);
      const member = teamMembers[memberIndex];
      // Fetch the latest data when modal opens to ensure we have current information
      const memberDetail = await getTeamMemberDetail(member.memberId);

      // Combine API response with team member data for complete information
      setSelectedMember({
        ...memberDetail,
        memberRole: member.teamRole || "MEMBER",
        memberName: member.memberName
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching member details:", error);
    } finally {
      setLoadingMember(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Helper function to generate initials from name
  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Function to render avatar with proper fallback
  const renderAvatar = (member, size = "small") => {
    if (!member) return null;

    const avatarUrl = member.memberAvatar || member.userAvatar;
    const name = member.memberName || member.fullName || "User";
    const sizeClass = size === "small" ? "w-28 h-28" : "w-36 h-36";

    return (
      <div className={`${sizeClass} rounded-full border-4 border-orange-500 shadow-lg overflow-hidden relative`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              // Replace with initials fallback
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('bg-gray-200');

              // Check if initial element already exists
              if (!e.target.parentNode.querySelector('.initials-fallback')) {
                const initialsEl = document.createElement('div');
                initialsEl.className = 'initials-fallback flex items-center justify-center w-full h-full';
                initialsEl.innerHTML = `<span class="text-gray-600 font-bold" style="font-size: ${size === 'small' ? '2rem' : '2.5rem'}">${getInitials(name)}</span>`;
                e.target.parentNode.appendChild(initialsEl);
              }
            }}
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
            <span className="text-gray-600 font-bold" style={{ fontSize: size === 'small' ? '2rem' : '2.5rem' }}>
              {getInitials(name)}
            </span>
          </div>
        )}
      </div>
    );
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
          <Col key={index} sm={12} md={6} lg={4} className="mb-4">
            <Card
              className="h-full bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              onClick={() => handleShowModal(index)}
            >
              <div className="bg-green-600 h-2"></div>
              <Card.Body className="flex flex-col items-center text-center p-6">
                {/* Member Avatar */}
                <div className="mb-4 relative">
                  {renderAvatar(member, "small")}
                  <span className="absolute bottom-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {member.teamRole || "MEMBER"}
                  </span>
                </div>

                {/* Member Name */}
                <Card.Title className="text-xl font-bold text-gray-800 mb-1">{member.memberName}</Card.Title>

                {/* Member Email */}
                <Card.Subtitle className="text-sm text-gray-500 mb-3">
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {member.memberEmail}
                  </span>
                </Card.Subtitle>

                {/* View Details Button */}
                <button className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium flex items-center">
                  View Details
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal for Detailed Info */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3">
          <Modal.Title className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Team Member Profile
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-gray-50 px-0 py-0">
          {loadingMember ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              <p className="ml-3 text-gray-600">Loading member details...</p>
            </div>
          ) : selectedMember ? (
            <div>
              {/* Header section with avatar and name */}
              <div className="bg-white p-6 shadow-sm border-b flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-shrink-0">
                  {renderAvatar(selectedMember, "large")}
                </div>

                <div className="flex-grow text-center md:text-left">
                  <div className="flex flex-row items-center justify-center md:justify-start gap-2">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {selectedMember.memberRole}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedMember.fullName}</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mt-3">
                    <span className="inline-flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selectedMember.email}
                    </span>

                    <span className="inline-flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {selectedMember.fptFacility?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Member details section */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EXE Class */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500 mb-1">EXE Class</p>
                    <p className="font-medium text-gray-800">{selectedMember.exeClass || "Not specified"}</p>
                  </div>

                  {/* Facility */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500 mb-1">Facility</p>
                    <p className="font-medium text-gray-800">{selectedMember.fptFacility?.replace(/_/g, ' ') || "Not specified"}</p>
                  </div>

                  {/* Team ID */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500 mb-1">Team ID</p>
                    <p className="font-medium text-gray-800">{selectedMember.teamId || "Not specified"}</p>
                  </div>

                  {/* Portfolio Link - Only show if available */}
                  {selectedMember.studentPortfolio && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <p className="text-sm text-gray-500 mb-1">Portfolio</p>
                      <a
                        href={selectedMember.studentPortfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 font-medium flex items-center"
                      >
                        View Portfolio
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-10 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Could not load member details.</span>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-gray-100">
          <Button
            onClick={handleCloseModal}
            className="bg-green-600 hover:bg-green-700 text-white border-0 py-2 px-6 rounded-md transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProjectTeam;