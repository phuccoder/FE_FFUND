import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner } from "react-bootstrap";
import { createTeam } from "src/services/teamService";
import Layout from "@/components/Layout/Layout";
import Header from "@/components/Header/Header";
import PageTitle from "@/components/Reuseable/PageTitle";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import invitationService from "src/services/invitationService";

const CreateTeamPage = () => {
  const router = useRouter();
  const [teamData, setTeamData] = useState({
    teamName: "",
    teamDescription: "",
    memberEmails: [""] // Start with one empty email field
  });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]); // For search results
  const [searchingIndex, setSearchingIndex] = useState(null); // Track which field is searching
  const [searching, setSearching] = useState(false); // Search status

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

    // Set the currently searching index
    setSearchingIndex(index);
  };

  // Add search functionality when email input changes
  useEffect(() => {
    if (searchingIndex === null) return;

    const searchEmail = teamData.memberEmails[searchingIndex];
    
    const searchFounders = async () => {
      // Only search if we have at least 1 character
      if (searchEmail && searchEmail.trim().length >= 1) {
        try {
          setSearching(true);
          console.log('Searching for:', searchEmail);
          const result = await invitationService.searchFounderByEmail(searchEmail);
          console.log('Search result:', result);

          if (!result || !result.data) {
            console.warn('No search results data found');
            setSearchResults([]);
            return;
          }

          // Filter out emails that are already in the team
          const currentEmails = teamData.memberEmails.filter(email => email.trim() !== "");
          const filteredResults = result.data.filter(founder => 
            !currentEmails.includes(founder.email.toLowerCase())
          );

          console.log('Filtered results:', filteredResults);
          setSearchResults(filteredResults);
        } catch (error) {
          console.error("Error searching founders:", error);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
        setSearching(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchFounders();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [teamData.memberEmails, searchingIndex]);

  const selectFounder = (founder) => {
    if (searchingIndex !== null) {
      const updatedEmails = [...teamData.memberEmails];
      updatedEmails[searchingIndex] = founder.email;
      setTeamData({
        ...teamData,
        memberEmails: updatedEmails
      });
      setSearchResults([]);
    }
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
      <PageTitle title="Create Team" />
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
                          <div className="position-relative" style={{ minHeight: "38px" }}>
                            <Form.Control
                              type="email"
                              value={email}
                              onChange={(e) => handleEmailChange(index, e.target.value)}
                              placeholder="Enter member email"
                              autoComplete="off"
                            />
                            
                            {searchingIndex === index && searching && (
                              <div className="position-absolute" style={{ right: '10px', top: '10px' }}>
                                <Spinner animation="border" size="sm" style={{ color: '#FF8C00' }} />
                              </div>
                            )}

                            {searchingIndex === index && searchResults.length > 0 && (
                              <div
                                className="position-absolute w-100 shadow-sm bg-white rounded border"
                                style={{
                                  zIndex: 1050,
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  top: 'calc(100% + 5px)',
                                  left: 0,
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                  position: 'absolute',
                                  borderRadius: '4px',
                                }}
                              >
                                {searchResults.map(founder => (
                                  <div
                                    key={founder.id}
                                    onClick={() => selectFounder(founder)}
                                    className="d-flex align-items-center py-2 px-3 border-bottom"
                                    style={{
                                      cursor: 'pointer',
                                      backgroundColor: 'white',
                                      transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    <div
                                      className="rounded-circle text-white d-flex align-items-center justify-content-center me-2"
                                      style={{
                                        width: '30px',
                                        height: '30px',
                                        backgroundColor: '#FF8C00',
                                        flexShrink: 0
                                      }}
                                    >
                                      <span>{founder.fullName ? founder.fullName.charAt(0) : '?'}</span>
                                    </div>
                                    <div>
                                      <div className="fw-bold">{founder.fullName || 'Unknown'}</div>
                                      <div className="small text-muted">{founder.email}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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