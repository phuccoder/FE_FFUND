import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card, ListGroup, Spinner } from "react-bootstrap";
import { inviteMember } from "src/services/teamService";
import useTeam from "@/hooks/useTeam";
import Layout from "@/components/Layout/Layout";
import Header from "@/components/Header/Header";
import PageTitle from "@/components/Reuseable/PageTitle";
import Image from "next/image";
import { useRouter } from "next/router";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import invitationService from "src/services/invitationService";


const InviteTeamMembersPage = () => {
    const router = useRouter();
    const { team, loading, error: teamError, refreshTeam } = useTeam();
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        // If no team is found after loading completes, redirect to team members page
        if (!loading && !team && !teamError) {
            router.push("/team-members");
        }

        // Show error toast if team loading fails
        if (teamError) {
            toast.error(`Error loading team: ${teamError}`);
        }
    }, [team, loading, teamError, router]);

    // Search founders as user types
    useEffect(() => {
        const searchFounders = async () => {
            // Only search if we have at least 1 characters (to avoid too many results)
            if (newMemberEmail.trim().length >= 1) {
                try {
                    setSearching(true);
                    console.log('Searching for:', newMemberEmail);
                    const result = await invitationService.searchFounderByEmail(newMemberEmail);
                    console.log('Search result:', result);

                    if (!result || !result.data) {
                        console.warn('No search results data found');
                        setSearchResults([]);
                        return;
                    }

                    // Check if team and teamMembers are available
                    if (team && team.teamMembers) {
                        // Filter out members who are already in the team
                        const currentTeamEmails = team.teamMembers.map(member =>
                            member.memberEmail.toLowerCase()
                        );

                        const filteredResults = result.data.filter(founder =>
                            !currentTeamEmails.includes(founder.email.toLowerCase())
                        );

                        console.log('Filtered results:', filteredResults);
                        setSearchResults(filteredResults);
                    } else {
                        // If team or teamMembers is not available, show all results
                        setSearchResults(result.data);
                    }
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

        // Debounce the search to avoid too many API calls
        const timeoutId = setTimeout(() => {
            searchFounders();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [newMemberEmail, team]);

    const handleInviteMember = async (e) => {
        e.preventDefault();
        if (!newMemberEmail) {
            toast.warn("Please enter an email address.");
            return;
        }

        try {
            setInviting(true);

            // Log the request body
            const requestBody = { memberEmail: newMemberEmail };
            console.log('Sending invitation with request body:', requestBody);

            await inviteMember(newMemberEmail);
            toast.success(`Invitation sent to ${newMemberEmail} successfully!`);
            setNewMemberEmail("");
            setSearchResults([]);

            // Refresh team data to show updated member list
            await refreshTeam();
        } catch (err) {
            console.error('Invitation error:', err);

            // Extract the actual error message from various possible error formats
            let errorMessage = "Unknown error";

            if (err.message) {
                // Try to parse the error message if it contains JSON
                if (err.message.includes('{') && err.message.includes('}')) {
                    try {
                        // Extract the JSON part from the error message
                        const jsonStr = err.message.substring(err.message.indexOf('{'), err.message.lastIndexOf('}') + 1);
                        const errorObj = JSON.parse(jsonStr);

                        // Display only the actual error message, not the status code
                        errorMessage = errorObj.error || errorObj.message || "Request failed";
                    } catch (parseError) {
                        // If JSON parsing fails, use the original message
                        errorMessage = err.message;
                    }
                } else {
                    errorMessage = err.message;
                }
            }

            // Display a clean error message to the user
            toast.error(`Failed to send invitation: ${errorMessage}`);
        } finally {
            setInviting(false);
        }
    };

    const selectFounder = (founder) => {
        setNewMemberEmail(founder.email);
        setSearchResults([]);
    };

    if (loading) {
        return (
            <Layout>
                <Header />
                <PageTitle title="Invite Team Members" parent="Team" />
                <Container className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#FF8C00' }} />
                    <p className="mt-3">Loading team information...</p>
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            <Header />
            <PageTitle title="Invite Team Members" parent="Team" />
            <ToastContainer position="top-right" autoClose={5000} />
            <Container className="py-5 mt-12">
                <Row className="mt-4">
                    <Col lg={8} className="mx-auto">
                        {team && (
                            <Card className="shadow border-0 rounded-3 overflow-hidden">
                                <Card.Header style={{ backgroundColor: '#FF8C00', color: 'white' }}>
                                    <h4 className="mb-0 fw-bold text-white">{team.teamName} - Team Members</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <ListGroup className="mb-4" variant="flush">
                                        {team.teamMembers && team.teamMembers.map((member) => (
                                            <ListGroup.Item key={member.memberId} className="d-flex align-items-center py-3 px-0 border-bottom">
                                                <div className="me-3">
                                                    {member.memberAvatar ? (
                                                        <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                                                            <Image
                                                                src={member.memberAvatar}
                                                                alt={member.memberName}
                                                                fill
                                                                className="rounded-circle"
                                                                style={{ objectFit: 'cover' }}
                                                                unoptimized
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="rounded-circle text-white d-flex align-items-center justify-content-center"
                                                            style={{ width: '50px', height: '50px', backgroundColor: '#FF8C00' }}
                                                        >
                                                            <span className="fs-4">{member.memberName.charAt(0)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong className="fs-5">{member.memberName}</strong>
                                                    <div className="text-muted small">{member.memberEmail}</div>
                                                </div>
                                                <div className="ms-auto">
                                                    <span
                                                        className="badge rounded-pill px-3 py-2"
                                                        style={{ backgroundColor: member.teamRole === 'LEADER' ? '#FF8C00' : '#6c757d' }}
                                                    >
                                                        {member.teamRole}
                                                    </span>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>

                                    <h5 className="mb-3 fw-bold">Invite New Member</h5>

                                    <Form onSubmit={handleInviteMember} className="position-relative" style={{ marginBottom: "200px" }}>
                                        <Row className="align-items-end g-3">
                                            <Col md={8}>
                                                <Form.Group>
                                                    <div className="position-relative" style={{ minHeight: "60px" }}>
                                                        <Form.Control
                                                            type="email"
                                                            placeholder="Enter email address"
                                                            value={newMemberEmail}
                                                            onChange={(e) => setNewMemberEmail(e.target.value)}
                                                            required
                                                            style={{ borderColor: '#ddd', padding: '0.625rem' }}
                                                            className="rounded-3"
                                                            autoComplete="off"
                                                        />

                                                        {searching && (
                                                            <div className="position-absolute" style={{ right: '10px', top: '10px' }}>
                                                                <Spinner animation="border" size="sm" style={{ color: '#FF8C00' }} />
                                                            </div>
                                                        )}

                                                        {searchResults && searchResults.length > 0 && (
                                                            <div
                                                                className="position-absolute w-100 shadow-sm bg-white rounded border"
                                                                style={{
                                                                    zIndex: 1050,
                                                                    maxHeight: '300px', // Increased height
                                                                    overflowY: 'auto', // Enable vertical scrolling
                                                                    top: 'calc(100% + 5px)',
                                                                    left: 0,
                                                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                                    position: 'absolute',
                                                                    borderRadius: '4px',
                                                                    display: 'block' // Ensure it's displayed as a block
                                                                }}
                                                            >
                                                                {/* Use a plain div structure instead of ListGroup to ensure proper scrolling */}
                                                                {searchResults.map(founder => (
                                                                    <div
                                                                        key={founder.id}
                                                                        onClick={() => selectFounder(founder)}
                                                                        className="d-flex align-items-center py-2 px-3 border-bottom"
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            backgroundColor: 'white',
                                                                            transition: 'background-color 0.2s',
                                                                            hover: { backgroundColor: '#f8f9fa' }
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
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Button
                                                    type="submit"
                                                    disabled={inviting}
                                                    style={{
                                                        backgroundColor: '#FF8C00',
                                                        borderColor: '#FF8C00',
                                                        padding: '0.625rem'
                                                    }}
                                                    className="w-100 rounded-3"
                                                >
                                                    {inviting ? (
                                                        <>
                                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                            Sending...
                                                        </>
                                                    ) : 'Send Invitation'}
                                                </Button>
                                            </Col>
                                        </Row>
                                        <div style={{ height: "150px" }}></div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>
        </Layout>
    );
};

export default function InviteTeamMembers() {
    return (
        <ProtectedRoute requiredRoles={['FOUNDER']}>
            <InviteTeamMembersPage />
        </ProtectedRoute>
    );
};