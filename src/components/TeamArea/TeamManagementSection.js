import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Alert, Modal } from "react-bootstrap";
import Link from "next/link";
import Title from "../Reuseable/Title";
import TeamMainArea from "./TeamMainArea";
import { deleteTeam } from "src/services/teamService";
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

  // Initialize with role from localStorage at component mount
  useEffect(() => {
    // Check localStorage for LEADER role immediately
    const teamRole = localStorage.getItem('teamRole');
    const isLeaderInStorage = teamRole === 'LEADER';

    console.log('Initial check - Team role from localStorage:', teamRole);

    if (isLeaderInStorage) {
      console.log('User is LEADER according to localStorage - setting initial admin status');
      setUserIsAdmin(true);
      setUserPermissions(prev => ({
        ...prev,
        isAdmin: true,
        canUpdateRoles: true,
        canDeleteMembers: true,
        canDeleteTeam: localStorage.getItem('role') === 'FOUNDER'
      }));
    }
  }, []);

  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        setLoading(true);

        // Get user data from localStorage
        const userDataStr = localStorage.getItem('user');
        const role = localStorage.getItem('role');
        const teamRole = localStorage.getItem('teamRole');

        if (!userDataStr) {
          setLoading(false);
          return;
        }

        const userData = JSON.parse(userDataStr);
        console.log('User data from localStorage:', userData);
        console.log('Role from localStorage:', role);
        console.log('Team role from localStorage:', teamRole);

        // First set user permissions based on localStorage if they're a LEADER
        const isLeaderInStorage = teamRole === 'LEADER';
        const isFounder = role === 'FOUNDER';

        if (isLeaderInStorage) {
          console.log('User is LEADER according to localStorage');

          const storageBasedPermissions = {
            isAdmin: true,
            canUpdateRoles: true,
            canDeleteMembers: true,
            canDeleteTeam: isFounder
          };

          setUserIsAdmin(true);
          setUserPermissions(storageBasedPermissions);

          console.log('Permissions set from localStorage:', storageBasedPermissions);
        }

        if (!team || !team.teamMembers || team.teamMembers.length === 0) {
          console.log('No team or team members data available');

          // If we have a teamRole but no team data, still set the user with their role
          if (teamRole) {
            setCurrentUser({
              ...userData,
              teamRole: teamRole
            });
          }

          setLoading(false);
          return;
        }

        // Find the current user in the team members
        const currentUserInfo = team.teamMembers.find(member =>
          member.userId === userData.id ||
          member.memberEmail.toLowerCase() === userData.email.toLowerCase()
        );

        console.log('Current user found in team members:', currentUserInfo);

        // Determine if user is a leader from team data
        const isLeaderInTeam = currentUserInfo?.teamRole === 'LEADER';

        console.log('Is leader in team data:', isLeaderInTeam);
        console.log('Is leader in localStorage:', isLeaderInStorage);

        // Combine the two sources of truth - a user is a leader if either source says so
        const isLeader = isLeaderInTeam || isLeaderInStorage;
        console.log('Final combined leader status:', isLeader);

        if (currentUserInfo) {
          // Always trust team data for the teamRole if it exists, fallback to localStorage
          const effectiveTeamRole = currentUserInfo.teamRole || teamRole;

          // Set current user with team role information
          setCurrentUser({
            ...userData,
            teamRole: effectiveTeamRole,
            memberId: currentUserInfo.memberId
          });

          // Determine permissions based on combined role information
          const permissions = {
            isAdmin: isLeader,
            canUpdateRoles: isLeader,
            canDeleteMembers: isLeader,
            canDeleteTeam: isLeader && isFounder
          };

          console.log('User permissions determined from team data + localStorage:', permissions);
          setUserIsAdmin(permissions.isAdmin);
          setUserPermissions(permissions);
        } else if (teamRole) {
          // User not found in team members but has teamRole in localStorage
          setCurrentUser({
            ...userData,
            teamRole: teamRole
          });

          // Set permissions based on localStorage teamRole
          const isLeaderRole = teamRole === 'LEADER';

          const permissions = {
            isAdmin: isLeaderRole,
            canUpdateRoles: isLeaderRole,
            canDeleteMembers: isLeaderRole,
            canDeleteTeam: isLeaderRole && isFounder
          };

          console.log('User permissions from localStorage only:', permissions);
          setUserIsAdmin(permissions.isAdmin);
          setUserPermissions(permissions);
        } else {
          console.log('Current user not found in team members list and no teamRole in localStorage');
        }
      } catch (err) {
        console.error("Failed to check user permissions:", err);
        setError("Failed to load user permissions. Some features might be unavailable.");
      } finally {
        setLoading(false);
      }
    };

    if (team) {
      checkUserPermissions();
    }
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

  // For debugging - log the user permissions whenever they change
  useEffect(() => {
    console.log('User is admin:', userIsAdmin);
    console.log('Current user permissions:', userPermissions);
  }, [userIsAdmin, userPermissions]);

  return (
    <div className="team-management-section py-4" data-testid="team-management">
      {/* Header Section in its own container */}
      <Container className="mb-4">
        {/* Title and Button Row */}
        <Row className="justify-content-between align-items-center mb-4">
          <Col lg={7}>
            <Title tagline="Team Management" className="section-title-2" />
            {currentUser?.teamRole && (
              <div className="mt-2">
                <span className="badge bg-info">Your Role: {currentUser.teamRole}</span>
              </div>
            )}
          </Col>
          <Col lg={5} className="text-lg-end">
            <div className="d-flex flex-column align-items-end">
              {/* Edit Team button - only for team leaders */}
              {userIsAdmin && (
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
              {userIsAdmin && (
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
          <Alert variant="warning" className="mb-4" dismissible onClose={() => setError(null)}>
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