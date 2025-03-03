import React, { useState, useEffect } from "react";
import { Button, Form, Alert, Spinner, Modal } from "react-bootstrap";
import { updateTeam } from "src/services/teamService";

// Update the component to handle both prop patterns
const TeamEditComponent = ({ 
  // For parent-controlled modal:
  show, 
  onHide,
  // For self-controlled modal: 
  userPermissions = { isAdmin: false },  // Add default value
  team,
  onTeamUpdate = () => {}
}) => {
  // If show/onHide are provided, use those (parent controls modal)
  // Otherwise use internal state (self-controlled)
  const isParentControlled = show !== undefined && onHide !== undefined;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    teamDescription: "",
  });

  // Reset form data when team data changes or modal opens
  useEffect(() => {
    if (team) {
      setFormData({
        teamName: team.teamName || "",
        teamDescription: team.teamDescription || "",
      });
    }
  }, [team, isParentControlled ? show : showEditModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status states
    setUpdateError(null);
    setUpdateSuccess(false);
    
    // Validate required fields
    if (!formData.teamName.trim()) {
      setUpdateError("Team name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!team || !team.teamId) {
        throw new Error("Team information is missing");
      }
      
      await updateTeam(team.teamId, {
        teamName: formData.teamName,
        teamDescription: formData.teamDescription,
      });
      
      setUpdateSuccess(true);
      
      // Refresh team data after successful update
      onTeamUpdate();
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        if (isParentControlled) {
          onHide();
        } else {
          setShowEditModal(false);
        }
      }, 1500);
      
    } catch (error) {
      console.error("Team update error:", error);
      setUpdateError(error.message || "Failed to update team information");
    } finally {
      setIsSubmitting(false);
    }
  };

  // For self-controlled mode, check permissions
  if (!isParentControlled && !userPermissions?.isAdmin) {
    return null;
  }

  // Handle both modal control patterns
  const displayModal = isParentControlled ? show : showEditModal;
  const closeModal = isParentControlled ? onHide : () => setShowEditModal(false);

  // For self-controlled mode, render the button too
  if (isParentControlled) {
    return (
      <Modal show={displayModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Team Information</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {updateError && (
              <Alert variant="danger" dismissible onClose={() => setUpdateError(null)}>
                {updateError}
              </Alert>
            )}
            
            {updateSuccess && (
              <Alert variant="success">
                Team information updated successfully!
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                placeholder="Enter team name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Team Description</Form.Label>
              <Form.Control
                as="textarea"
                name="teamDescription"
                value={formData.teamDescription}
                onChange={handleInputChange}
                placeholder="Enter team description"
                rows={3}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#FF8C00',
                borderColor: '#FF8C00',
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }

  // Self-controlled mode with both button and modal
  return (
    <>
      <Button
        variant="outline-primary"
        className="me-2 mb-2"
        onClick={() => setShowEditModal(true)}
        style={{
          borderColor: "#FF8C00",
          color: "#FF8C00",
        }}
      >
        <i className="fa fa-edit me-2"></i>
        Edit Team Info
      </Button>

      <Modal show={displayModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Team Information</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Same modal body as above */}
            {updateError && (
              <Alert variant="danger" dismissible onClose={() => setUpdateError(null)}>
                {updateError}
              </Alert>
            )}
            
            {updateSuccess && (
              <Alert variant="success">
                Team information updated successfully!
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                placeholder="Enter team name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Team Description</Form.Label>
              <Form.Control
                as="textarea"
                name="teamDescription"
                value={formData.teamDescription}
                onChange={handleInputChange}
                placeholder="Enter team description"
                rows={3}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#FF8C00',
                borderColor: '#FF8C00',
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default TeamEditComponent;