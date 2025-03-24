import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { createTeam } from "src/services/teamService";
import Layout from "@/components/Layout/Layout";
import Header from "@/components/Header/Header";
import PageTitle from "@/components/Reuseable/PageTitle";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const CreateTeamPage = () => {
  const router = useRouter();
  const [teamData, setTeamData] = useState({
    teamName: "",
    teamDescription: "",
    memberEmails: [""] // Start with one empty email field
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeamData({
      ...teamData,
      [name]: value
    });
  };

  const handleEmailChange = (index, value) => {
    const updatedEmails = [...teamData.memberEmails];
    updatedEmails[index] = value;
    setTeamData({
      ...teamData,
      memberEmails: updatedEmails
    });
  };

  const addEmailField = () => {
    setTeamData({
      ...teamData,
      memberEmails: [...teamData.memberEmails, ""]
    });
  };

  const removeEmailField = (index) => {
    const updatedEmails = teamData.memberEmails.filter((_, i) => i !== index);
    setTeamData({
      ...teamData,
      memberEmails: updatedEmails
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Remove empty email fields
    const filteredEmails = teamData.memberEmails.filter(email => email.trim() !== "");
    
    // Create and log the request body
    const requestBody = {
      teamName: teamData.teamName,
      teamDescription: teamData.teamDescription,
      memberEmails: filteredEmails
    };
    
    console.log('Creating team with request body:', requestBody);
    
    try {
      setLoading(true);
      
      // Make the API call
      const response = await createTeam(
        teamData.teamName,
        teamData.teamDescription,
        filteredEmails
      );
      
      // Log the response
      console.log('Team creation response:', response);
      
      // Show success toast
      toast.success("Team created successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Reset form
      setTeamData({
        teamName: "",
        teamDescription: "",
        memberEmails: [""]
      });
      
      // Redirect after successful creation
      setTimeout(() => {
        router.push("/team-members");
      }, 2000);
      
    } catch (err) {
      console.error('Team creation error:', err);
      
      // Show error toast
      toast.error(`Failed to create team: ${err.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header />
      {/* Add ToastContainer to handle notifications */}
      <ToastContainer position="top-right" autoClose={5000} />
      <Container className="py-5">
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="shadow-sm">
              <Card.Header style={{ backgroundColor: "#FF8C00", color: "white" }}>
                <h4 className="mb-0">Create a New Team</h4>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Team Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="teamName"
                      value={teamData.teamName}
                      onChange={handleChange}
                      placeholder="Enter team name"
                      required
                      className="border-orange focus:ring-orange-500"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Team Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="teamDescription"
                      value={teamData.teamDescription}
                      onChange={handleChange}
                      placeholder="Enter team description"
                      required
                    />
                  </Form.Group>
                  
                  <div className="mb-3">
                    <Form.Label>Invite Team Members</Form.Label>
                    {teamData.memberEmails.map((email, index) => (
                      <Row key={index} className="mb-2 align-items-center">
                        <Col>
                          <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            placeholder="Enter member email"
                          />
                        </Col>
                        <Col xs="auto">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => removeEmailField(index)}
                            disabled={teamData.memberEmails.length === 1}
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      onClick={addEmailField}
                      className="mt-2"
                      style={{ borderColor: "#FF8C00", color: "#FF8C00" }}
                    >
                      + Add Another Email
                    </Button>
                  </div>
                  
                  <div className="d-grid mt-4">
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={loading}
                      style={{ backgroundColor: "#FF8C00", borderColor: "#FF8C00" }}
                      className="text-white hover:bg-orange-700"
                    >
                      {loading ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

export default function CreateTeam(){
  return (
    <ProtectedRoute requiredRoles={['FOUNDER']}>
      <CreateTeamPage />
    </ProtectedRoute>
  );
}
