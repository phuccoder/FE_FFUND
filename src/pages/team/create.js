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

    // Create and log the request body
    const requestBody = {
      teamName: teamData.teamName,
      teamDescription: teamData.teamDescription
    };

    console.log('Creating team with request body:', requestBody);

    try {
      setLoading(true);

      // Make the API call
      const response = await createTeam(
        teamData.teamName,
        teamData.teamDescription
      );

      // Log the response
      console.log('Team creation response:', response);

      // Save team role to localStorage - the creator automatically becomes LEADER
      localStorage.setItem('teamRole', 'LEADER');
      console.log('Team role set in localStorage: LEADER');

      // Dispatch storage event to notify other components about the auth state change
      window.dispatchEvent(new Event('storage'));

      // Show success toast
      toast.success("Team created successfully! You are now the team leader.", {
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
      <ToastContainer />
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

export default function CreateTeam() {
  return (
    <ProtectedRoute requiredRoles={['FOUNDER']}>
      <CreateTeamPage />
    </ProtectedRoute>
  );
}