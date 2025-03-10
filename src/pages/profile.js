import { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab } from 'react-bootstrap';
import Head from 'next/head';
import BasicProfileInfo from '../components/profile/BasicProfileInfo';
import ExtendedProfileInfo from '../components/profile/ExtendedProfileInfo';
import Header from '@/components/Header/Header';
import Layout from '@/components/Layout/Layout';
import { getUserById } from '../services/userService';

export default function Profile() {
    const [key, setKey] = useState('basic');
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const userData = await getUserById();
                setUserRole(userData.roles);
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };

        fetchUserRole();
    }, []);

    return (
        <>
            <Layout>
                <Header />
                <Head>
                    <title>User Profile</title>
                </Head>
                <Container className="py-5">
                    <h1 className="text-3xl font-bold mb-5">User Profile</h1>

                    <Tab.Container id="profile-tabs" activeKey={key} onSelect={(k) => setKey(k)}>
                        <Row>
                            <Col sm={12} className="mb-4">
                                <Nav variant="tabs" className="border-b border-gray-200">
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="basic"
                                            className={`px-4 py-2 font-medium ${key === 'basic' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Basic Information
                                        </Nav.Link>
                                    </Nav.Item>
                                    {userRole === 'FOUNDER' && (
                                        <Nav.Item>
                                            <Nav.Link
                                                eventKey="extended"
                                                className={`px-4 py-2 font-medium ${key === 'extended' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Additional Information
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                </Nav>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={12}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="basic">
                                        <BasicProfileInfo />
                                    </Tab.Pane>
                                    {userRole === 'FOUNDER' && (
                                        <Tab.Pane eventKey="extended">
                                            <ExtendedProfileInfo />
                                        </Tab.Pane>
                                    )}
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Container>
            </Layout>
        </>
    );
}