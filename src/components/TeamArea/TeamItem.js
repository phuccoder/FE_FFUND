import Image from "next/image";
import React, { useState } from "react";
import { Col, Dropdown, Modal, Button } from "react-bootstrap";
import { updateMemberRole, removeMember } from "src/services/teamService";


const TeamItem = ({ 
  team = {}, 
  isAdmin = false, 
  hideHeader = false,
  userPermissions = {
    canUpdateRoles: false,
    canDeleteMembers: false
  },
  onTeamUpdate = () => {}
}) => {
  const { teamId, teamName, teamDescription, teamMembers } = team;
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const ROLE_OPTIONS = [
    'LEADER',
    'DEVELOPER',
    'DESIGNER',
    'CONTENT_WRITER',
    'RESEARCHER',
    'QA_TESTER',
    'SALES',
    'CMO',
    'CFO',
    'CTO'
  ];

  const handleOpenRoleModal = (member) => {
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const handleOpenDeleteModal = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleUpdateRole = async (newRole) => {
    if (!selectedMember) return;

    try {
      setIsUpdating(true);
      setError(null);
      await updateMemberRole(selectedMember.memberId, newRole);
      setShowRoleModal(false);
      onTeamUpdate(); // Refresh team data
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update member role. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      setIsUpdating(true);
      setError(null);
      await removeMember(selectedMember.memberId);
      setShowDeleteModal(false);
      onTeamUpdate(); // Refresh team data
    } catch (err) {
      console.error('Failed to delete member:', err);
      setError('Failed to remove team member. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Col lg={4} md={7}>
      <div className="team-item mt-30">
        {!hideHeader && (
          <div className="team-content text-center mb-3">
            <h3 className="title" style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '0.75rem'
            }}>
              {teamName}
            </h3>
            <span>{teamDescription}</span>
          </div>
        )}

        {/* Team Members Row Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          {teamMembers && teamMembers.map((member) => (
            <div
              key={member.memberId}
              className="team-member-item"
              style={{
                flex: '0 0 auto',
                width: 'calc(33% - 1rem)',
                minWidth: '80px',
                marginBottom: '1rem',
                position: 'relative'
              }}
            >
              <div className="team-thumb" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                width: '100%'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '50%'
                }}>
                  <Image
                    src={member.memberAvatar || '/assets/images/default-avatar.png'}
                    alt={member.memberName}
                    width={100}
                    height={100}
                    unoptimized
                    style={{
                      width: 'auto',
                      height: 'auto',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                {/* Admin Actions Dropdown */}
                {isAdmin && member.teamRole !== 'LEADER' && !member.isFounder && (
                  <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    zIndex: 5
                  }}>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="light"
                        size="sm"
                        style={{
                          padding: '0.25rem',
                          fontSize: '0.7rem',
                          backgroundColor: '#f8f9fa',
                          borderColor: '#dee2e6',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="fa fa-ellipsis-v" style={{ fontSize: '0.7rem' }}></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu size="sm">
                        <Dropdown.Item
                          onClick={() => handleOpenRoleModal(member)}
                        >
                          <i className="fa fa-user-tag me-2" style={{ fontSize: '0.8rem' }}></i>
                          <span style={{ fontSize: '0.9rem' }}>Change Role</span>
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleOpenDeleteModal(member)}
                          className="text-danger"
                        >
                          <i className="fa fa-user-minus me-2" style={{ fontSize: '0.8rem' }}></i>
                          <span style={{ fontSize: '0.9rem' }}>Remove</span>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}
              </div>
              <div className="team-content text-center mt-2">
                <h6 className="member-name" style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {member.memberName}
                  {member.isFounder && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#FF8C00',
                        color: 'white',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '10px',
                        marginLeft: '0.4rem',
                        verticalAlign: 'middle'
                      }}
                    >
                      FOUNDER
                    </span>
                  )}
                </h6>
                <span className="member-role" style={{
                  fontSize: '0.8rem',
                  color: member.teamRole === 'LEADER' ? '#FF8C00' : '#6c757d'
                }}>
                  {member.teamRole}
                </span>
              </div>
            </div>
          ))}
        </div>

        {(!teamMembers || teamMembers.length === 0) && (
          <div className="text-center text-muted">
            <p>No team members available</p>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Role for {selectedMember?.memberName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
            </div>
          )}
          <p>Select a new role for this team member:</p>
          <div className="d-grid gap-2">
            {ROLE_OPTIONS.map(role => (
              <Button
                key={role}
                variant={selectedMember?.teamRole === role ? "primary" : "outline-secondary"}
                onClick={() => handleUpdateRole(role)}
                disabled={isUpdating}
                className="text-start"
              >
                {role}
              </Button>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Member Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Remove Team Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
            </div>
          )}
          <p>Are you sure you want to remove <strong>{selectedMember?.memberName}</strong> from the team?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteMember}
            disabled={isUpdating}
          >
            {isUpdating ? 'Removing...' : 'Remove Member'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Col>
  );
};

export default TeamItem;