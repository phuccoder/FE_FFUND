import React, { useState, useEffect } from "react";
import { reportService } from "../services/reportService";
import { message, Modal, Tabs } from "antd";
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    EyeOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import Header from '@/components/Header/Header';
import Layout from '@/components/Layout/Layout';
import PageTitle from "@/components/Reuseable/PageTitle";
import { requestService } from "src/services/RequestService";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const { TabPane } = Tabs;

function RequestManager() {
    const [requests, setRequests] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isReport, setIsReport] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [userRole, setUserRole] = useState(null);

    // Get user role from localStorage on component mount
    useEffect(() => {
        // Check if we're running in the browser (not during SSR)
        if (typeof window !== 'undefined') {
            try {
                // Get user info from localStorage
                const userRole = localStorage.getItem('role');
                setUserRole(userRole);

                // Set the appropriate default active tab based on user role
                if (userRole === "INVESTOR") {
                    setActiveTab("2"); // Reports tab
                    setIsReport(true);
                } else {
                    setActiveTab("1"); // Requests tab
                    setIsReport(false);
                }
            } catch (error) {
                console.error("Error parsing user info from localStorage:", error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Only fetch data based on user role
                if (userRole === "FOUNDER") {
                    // For FOUNDER, only fetch requests
                    const requestResponse = await requestService.getRequestByUser();
                    setRequests(requestResponse.data || []);
                } else if (userRole === "INVESTOR") {
                    // For INVESTOR, only fetch reports
                    const reportResponse = await reportService.getReportsByUser();
                    setReports(reportResponse.data || []);
                } else {
                    // For other roles (like ADMIN, MANAGER), fetch both
                    const requestResponse = await requestService.getRequestByUser();
                    setRequests(requestResponse.data || []);

                    const reportResponse = await reportService.getReportsByUser();
                    setReports(reportResponse.data || []);
                }
            } catch (error) {
                message.error("Failed to fetch data.");
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch data if we've determined the user role
        if (userRole !== null) {
            fetchData();
        }
    }, [userRole]);

    const handleViewDetails = (item, isReportItem) => {
        setSelectedItem(item);
        setIsReport(isReportItem);
        setModalVisible(true);
    };

    const handleCloseDetails = () => {
        setModalVisible(false);
    };

    const handleSort = (key, isReportData) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const dataToSort = isReportData ? [...reports] : [...requests];
        const sortedData = dataToSort.sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });

        if (isReportData) {
            setReports(sortedData);
        } else {
            setRequests(sortedData);
        }
    };

    const getStatusTag = (status) => {
        if (!status) {
            return (
                <span style={{
                    color: 'gray',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid gray',
                    fontSize: '12px'
                }}>
                    Pending
                </span>
            );
        }

        let color = '';
        switch (status.toLowerCase()) {
            case 'pending': color = 'orange'; break;
            case 'approved': color = 'green'; break;
            case 'rejected': color = 'red'; break;
            case 'under_review': color = 'blue'; break;
            default: color = 'blue';
        }
        return (
            <span style={{
                color: color,
                backgroundColor: `${color}10`,
                padding: '2px 8px',
                borderRadius: '10px',
                border: `1px solid ${color}`,
                fontSize: '12px'
            }}>
                {status}
            </span>
        );
    };

    const SortIndicator = ({ sortKey }) => {
        if (sortConfig.key !== sortKey) return null;
        return sortConfig.direction === 'asc'
            ? <ArrowUpOutlined style={{ fontSize: 12, marginLeft: 4 }} />
            : <ArrowDownOutlined style={{ fontSize: 12, marginLeft: 4 }} />;
    };

    const renderTable = (data, isReportData) => (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                    <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 500,
                        width: '5%'
                    }}>No.</th>
                    <th
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 500,
                            cursor: 'pointer',
                            width: '30%'
                        }}
                        onClick={() => handleSort('title', isReportData)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            Title
                            <SortIndicator sortKey="title" />
                        </div>
                    </th>
                    <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 500,
                        width: '15%'
                    }}>Type</th>
                    <th
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 500,
                            cursor: 'pointer',
                            width: '20%'
                        }}
                        onClick={() => handleSort('createdAt', isReportData)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            Created At
                            <SortIndicator sortKey="createdAt" />
                        </div>
                    </th>
                    <th
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 500,
                            cursor: 'pointer',
                            width: '15%'
                        }}
                        onClick={() => handleSort('status', isReportData)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            Status
                            <SortIndicator sortKey="status" />
                        </div>
                    </th>
                    <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 500,
                        width: '15%'
                    }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                    data.map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                            <td style={{ padding: '12px 16px' }}>{item.title}</td>
                            <td style={{ padding: '12px 16px' }}>{item.type}</td>
                            <td style={{ padding: '12px 16px' }}>
                                {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                {getStatusTag(item.status)}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <button
                                    onClick={() => handleViewDetails(item, isReportData)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <EyeOutlined style={{ marginRight: 4 }} />
                                    View
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px 16px' }}>
                            No data found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    // Show a loading state if we're still determining the user role or fetching data
    if (userRole === null || loading) {
        return (
            <Layout>
                <Header />
                <PageTitle title="Request/Report Management" />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                    Loading...
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Header />
            <PageTitle title={userRole === "INVESTOR" ? "Report Management" : userRole === "FOUNDER" ? "Request Management" : "Request/Report Management"} />
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)'
                }}>
                    {/* Show appropriate tabs based on user role */}
                    {userRole === "FOUNDER" ? (
                        // Only show Requests tab for FOUNDER
                        <div style={{ padding: '16px' }}>
                            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>My Requests</h2>
                            {renderTable(requests, false)}
                        </div>
                    ) : userRole === "INVESTOR" ? (
                        // Only show Reports tab for INVESTOR
                        <div style={{ padding: '16px' }}>
                            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>My Reports</h2>
                            {renderTable(reports, true)}
                        </div>
                    ) : (
                        // Show both tabs for other roles
                        <Tabs
                            activeKey={activeTab}
                            onChange={(key) => setActiveTab(key)}
                            style={{ padding: '0 16px' }}
                        >
                            <TabPane tab="Requests" key="1">
                                {renderTable(requests, false)}
                            </TabPane>
                            <TabPane tab="Reports" key="2">
                                {renderTable(reports, true)}
                            </TabPane>
                        </Tabs>
                    )}
                </div>

                {/* Modal for Details */}
                <Modal
                    title={isReport ? "Report Details" : "Request Details"}
                    visible={modalVisible}
                    onCancel={handleCloseDetails}
                    footer={[
                        <button
                            key="close"
                            onClick={handleCloseDetails}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #d9d9d9',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    ]}
                    width={800}
                >
                    {selectedItem && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <div>
                                        <strong>Title:</strong> {selectedItem.title}
                                    </div>
                                    <div>
                                        <strong>Type:</strong> {selectedItem.type}
                                    </div>
                                    <div>
                                        <strong>Status:</strong> {getStatusTag(selectedItem.status)}
                                    </div>

                                    {/* Add Extended Time Details for EXTEND_TIME type */}
                                    {!isReport && selectedItem.type === "EXTEND_TIME" && selectedItem.extendDay && (
                                        <div>
                                            <strong>Requested Extension:</strong>{' '}
                                            <span style={{ color: '#1890ff', fontWeight: 500 }}>
                                                {selectedItem.extendDay} days
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Timing</h3>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <div>
                                        <strong>Created At:</strong>{' '}
                                        {format(new Date(selectedItem.createdAt), 'dd MMM yyyy HH:mm')}
                                    </div>
                                    <div>
                                        <strong>Updated At:</strong>{' '}
                                        {selectedItem.updatedAt
                                            ? format(new Date(selectedItem.updatedAt), 'dd MMM yyyy HH:mm')
                                            : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Add Project Details for EXTEND_TIME type */}
                            {!isReport && selectedItem.type === "EXTEND_TIME" && selectedItem.projectId && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Project Information</h3>
                                    <div style={{
                                        backgroundColor: '#f6f9ff',
                                        padding: 12,
                                        borderRadius: 4,
                                        border: '1px solid #d9e8ff'
                                    }}>
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            <div>
                                                <strong>Project:</strong>{' '}
                                                {selectedItem.projectTitle || `Project ID: ${selectedItem.projectId}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Description</h3>
                                <div style={{
                                    backgroundColor: '#fafafa',
                                    padding: 12,
                                    borderRadius: 4,
                                    border: '1px solid #f0f0f0'
                                }}>
                                    {selectedItem.description}
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Response</h3>
                                <div style={{
                                    backgroundColor: '#fafafa',
                                    padding: 12,
                                    borderRadius: 4,
                                    border: '1px solid #f0f0f0'
                                }}>
                                    {selectedItem.response || "No response yet"}
                                </div>
                            </div>

                            {selectedItem.attachmentUrl && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Attachment</h3>
                                    <button
                                        onClick={() => window.open(selectedItem.attachmentUrl, '_blank')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px 12px',
                                            backgroundColor: 'transparent',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: 4,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <FileTextOutlined style={{ marginRight: 4 }} />
                                        View Attachment
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
};

export default function RequestManagerPage() {
    return (
        <ProtectedRoute requiredRoles={['FOUNDER', 'INVESTOR']}>
            <RequestManager />
        </ProtectedRoute>
    )
}