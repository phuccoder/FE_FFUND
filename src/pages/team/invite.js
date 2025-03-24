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

const InviteTeamMembersPage = () => {
    const router = useRouter();
    const { team, loading, error: teamError, refreshTeam } = useTeam();
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [inviting, setInviting] = useState(false);

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

            // Refresh team data to show updated member list
            await refreshTeam();
        } catch (err) {
            console.error('Invitation error:', err);
            toast.error(`Failed to send invitation: ${err.message || "Unknown error"}`);
        } finally {
            setInviting(false);
        }
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

                                    <Form onSubmit={handleInviteMember}>
                                        <Row className="align-items-end g-3">
                                            <Col md={8}>
                                                <Form.Group>
                                                    <Form.Label>Email Address</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        placeholder="Enter email address"
                                                        value={newMemberEmail}
                                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                                        required
                                                        style={{ borderColor: '#ddd', padding: '0.625rem' }}
                                                        className="rounded-3"
                                                    />
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

export default function InviteTeamMembers(){
    return (
        <ProtectedRoute requiredRoles={['FOUNDER']}>
            <InviteTeamMembersPage />
        </ProtectedRoute>
        
    );
}
