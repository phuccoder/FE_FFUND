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
  const [missingExtendedProfile, setMissingExtendedProfile] = useState(false);

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

        // Check if extended profile exists
        if (!userExtendedInfo || (!userExtendedInfo.studentClass && !userExtendedInfo.studentCode)) {
          setMissingExtendedProfile(true);
          setError("Please complete your extended profile information to access all features.");
          setLoading(false);
          return;
        }

        // Extract role and id from user data
        const userRole = userExtendedInfo?.user?.roles || null;
        const userId = userExtendedInfo?.user?.id || null;
        const userEmail = userExtendedInfo?.user?.email || null;

        console.log('User ID from extended info:', userId);
        console.log('User email from extended info:', userEmail);

        // Create a combined user object
        const userData = {
          ...userExtendedInfo,
          id: userId,
          email: userEmail,
          role: userRole,
          teamRole: null // Initialize with null, will set correctly below
        };

        // Store combined user data in state
        setCurrentUser(userData);

        if (team && team.teamMembers && team.teamMembers.length > 0) {
          console.log('Team members data:', team.teamMembers);

          // Check if user is in team by comparing userId, memberId or email
          const userMember = team.teamMembers.find(member => {
            const memberIdMatch = member.memberId && userId && member.memberId.toString() === userId.toString();
            const userIdMatch = member.userId && userId && member.userId.toString() === userId.toString();
            const emailMatch = member.memberEmail && userEmail && 
              member.memberEmail.toLowerCase() === userEmail.toLowerCase();
            
            const isMatch = memberIdMatch || userIdMatch || emailMatch;
            if (isMatch) {
              console.log('Found matching member:', member);
            }
            return isMatch;
          });

          if (userMember) {
            console.log('Found user in team members with role:', userMember.teamRole);
            // Set the teamRole in user data 
            userData.teamRole = userMember.teamRole;
            setCurrentUser({...userData});
          } else {
            console.log('User is not found in team members');
          }

          // Determine permissions based on teamRole and userRole
          const isLeader = userData.teamRole === 'LEADER';
          const isFounder = userRole === 'FOUNDER';

          const permissions = {
            isAdmin: isLeader,
            canUpdateRoles: isLeader,
            canDeleteMembers: isLeader,
            canDeleteTeam: isLeader && isFounder
          };

          console.log('Final permissions:', permissions);
          console.log('User is leader:', isLeader);
          console.log('User is founder:', isFounder);

          // Set the states based on the determined permissions
          setUserIsAdmin(permissions.isAdmin);
          setUserPermissions(permissions);
        } else {
          console.log('No team members found in team data');
        }
      } catch (err) {
        console.error("Failed to check user permissions:", err);
        // Check if the error is due to missing extended profile
        if (err.response && err.response.status === 404) {
          setMissingExtendedProfile(true);
          setError("Please complete your extended profile information to access all features.");
        } else {
          setError("Failed to load user permissions. Some features might be unavailable.");
        }
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

  // Handler to navigate to the extended profile page
  const navigateToExtendedProfile = () => {
    router.push("/profile?tab=extended");
  };

  return (
    <div className="team-management-section py-4">
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
            {!missingExtendedProfile ? (
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
            ) : (
              <Button
                variant="warning"
                onClick={navigateToExtendedProfile}
                style={{ width: '250px' }}
              >
                <i className="fa fa-exclamation-circle me-2"></i>
                Complete Your Profile
              </Button>
            )}
          </Col>
        </Row>

        {error && (
          <Alert variant="warning" className="mb-4" dismissible onClose={() => setError(null)}>
            {error}
            {missingExtendedProfile && (
              <div className="mt-2">
                <Button 
                  variant="outline-warning" 
                  onClick={navigateToExtendedProfile}
                  size="sm"
                >
                  Go to Profile Setup
                </Button>
              </div>
            )}
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
        ) : missingExtendedProfile ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="fa fa-user-edit" style={{ fontSize: '3rem', color: '#FF8C00' }}></i>
            </div>
            <h3 className="mb-3">Extended Profile Information Required</h3>
            <p className="mb-4">
              To access team management features, you need to complete your extended profile information first.
              This helps us better understand your role and position within the organization.
            </p>
            <Button
              variant="primary"
              onClick={navigateToExtendedProfile}
              style={{
                backgroundColor: '#FF8C00',
                borderColor: '#FF8C00',
              }}
            >
              Complete Your Profile Now
            </Button>
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