import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Alert, Modal } from "react-bootstrap";
import Link from "next/link";
import Title from "../Reuseable/Title";
import TeamMainArea from "./TeamMainArea";
import { getUserExtendedInfo } from "src/services/userService";
import { getTeamMemberInfo, deleteTeam } from "src/services/teamService";
import { useRouter } from "next/router";
import TeamEditComponent from "./TeamEditComponent";

const TeamManagementSection = ({ team, onTeamUpdate = () => { } }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState({
    isAdmin: false,
    canUpdateRoles: false,
    canDeleteMembers: false,
    canDeleteTeam: false
  });
  const [showEditModal, setShowEditModal] = useState(false);

  // Added state for delete team functionality
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        setLoading(true);

        // Get current user basic info
        const userExtendedInfo = await getUserExtendedInfo();

        // Extract role from user data
        const userRole = userExtendedInfo?.user?.roles || null;
        const userId = userExtendedInfo?.user?.id || null;

        // Create a combined user object with data from getUserExtendedInfo
        // and add teamRole from localStorage (which was saved during login)
        const userData = {
          ...userExtendedInfo,
          id: userId,
          email: userExtendedInfo?.user?.email,
          role: userRole,
          // Get teamRole from login response or localStorage
          teamRole: userExtendedInfo?.teamRole || localStorage.getItem('teamRole')
        };

        // Store combined user data in state
        setCurrentUser(userData);

        console.log('Combined user data:', userData);
        console.log('teamRole:', userData.teamRole);

        if (team) {
          console.log('Team data:', {
            id: team?.teamId,
            name: team?.teamName,
            memberCount: team?.teamMembers?.length || 0
          });

          // Try to determine permissions based on available data
          let isLeader = false;
          let isFounder = userRole === 'FOUNDER';

          // PRIORITY 1: Check the teamRole from user data or localStorage
          if (userData.teamRole === 'LEADER') {
            isLeader = true;
            console.log('User is identified as LEADER from teamRole');
          }
          // PRIORITY 2: Check if user is in team members with LEADER role
          else if (team.teamMembers && team.teamMembers.length > 0) {
            const userMember = team.teamMembers.find(member =>
              (userId && member.memberId && member.memberId.toString() === userId.toString()) ||
              (userId && member.userId && member.userId.toString() === userId.toString()) ||
              (userData.email && member.memberEmail && member.memberEmail.toLowerCase() === userData.email.toLowerCase())
            );

            if (userMember && userMember.teamRole === 'LEADER') {
              isLeader = true;
              console.log('User is identified as LEADER from team members data');
            }
          }

          // Set permissions based on role determination
          const permissions = {
            isAdmin: isLeader,
            canUpdateRoles: isLeader,
            canDeleteMembers: isLeader,
            canDeleteTeam: isLeader && isFounder
          };

          console.log('Final permissions:', permissions);

          // Set the states based on the permissions
          setUserIsAdmin(permissions.isAdmin);
          setUserPermissions(permissions);

          // Log authorization message for clarity
          if (permissions.isAdmin) {
            console.log('User is authorized as LEADER and can make changes');
          } else {
            console.log('User is NOT authorized as LEADER and cannot make changes');
          }
        }
      } catch (err) {
        console.error("Failed to check user permissions:", err);
        setError("Failed to load user permissions. Some features might be unavailable.");
      } finally {
        setLoading(false);
      }
    };

    checkUserPermissions();
  }, [team]);

  // Added handler for edit team functionality
  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // Added handler for delete team functionality
  const handleDeleteClick = () => {
    setShowDeleteTeamModal(true);
  };

  // Added handler for team deletion
  const handleDeleteTeam = async () => {
    if (!team || !team.teamId) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteTeam(team.teamId);
      setShowDeleteTeamModal(false);

      router.push("/team-members");
    } catch (err) {
      console.error('Failed to delete team:', err);
      setDeleteError('Failed to delete team. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="team-management-section py-4">
      {/* Header Section in its own container */}
      <Container className="mb-4">
        {/* Title and Button Row */}
        <Row className="justify-content-between align-items-center mb-4">
          <Col lg={7}>
            <Title tagline="Team Management" className="section-title-2" />
          </Col>
          <Col lg={5} className="text-lg-end">
            <div className="d-flex flex-column align-items-end">
              {/* Edit Team button - only for team leaders */}
              {userPermissions.isAdmin && (
                <Button
                  variant="info"
                  className="mb-2"
                  onClick={handleEditClick}
                  style={{
                    backgroundColor: '#17a2b8',
                    borderColor: '#17a2b8',
                    color: 'white',
                    width: '200px'
                  }}
                >
                  <i className="fa fa-edit me-2"></i>
                  Edit Team Info
                </Button>
              )}

              {/* Only show Invite Members button if user is a LEADER */}
              {userPermissions.isAdmin && (
                <Link href="/team/invite" passHref>
                  <Button
                    variant="primary"
                    className="mb-2"
                    style={{
                      backgroundColor: '#FF8C00',
                      borderColor: '#FF8C00',
                      width: '200px'
                    }}
                  >
                    <i className="fa fa-user-plus me-2"></i>
                    Invite Members
                  </Button>
                </Link>
              )}

              {/* Added Delete Team Button - only visible if user has permission */}
              {userPermissions.canDeleteTeam && (
                <Button
                  variant="danger"
                  onClick={handleDeleteClick}
                  style={{ width: '200px' }}
                >
                  <i className="fa fa-trash me-2"></i>
                  Delete Team
                </Button>
              )}
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Container>

      {/* Team Members Section in its own container */}
      <Container>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" style={{ color: '#FF8C00' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Checking permissions...</p>
          </div>
        ) : (
          <TeamMainArea
            teamData={team}
            isAdmin={userIsAdmin}
            userPermissions={userPermissions}
            onTeamUpdate={onTeamUpdate}
            currentUser={currentUser}
          />
        )}
      </Container>

      {/* Team Edit Modal */}
      <TeamEditComponent
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        team={team}
        onTeamUpdate={onTeamUpdate}
        userPermissions={userPermissions} 
      />

      {/* Added Delete Team Modal */}
      <Modal show={showDeleteTeamModal} onHide={() => setShowDeleteTeamModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <div className="alert alert-danger mb-3">
              {deleteError}
            </div>
          )}
          <p className="fw-bold">Warning: You&apos;re about to delete the entire team &quot;{team?.teamName}&quot;.</p>
          <p>This will permanently remove all team members and all associated data.</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteTeamModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteTeam}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeamManagementSection;