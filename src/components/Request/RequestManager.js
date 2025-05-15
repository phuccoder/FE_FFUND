import React, { useState, useEffect } from "react";
import { requestService } from "../../services/requestService";
import { reportService } from "src/services/reportService";
import { message, Modal, Tabs } from "antd";
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    EyeOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';

const { TabPane } = Tabs;

const RequestManager = () => {
    const [requests, setRequests] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isReport, setIsReport] = useState(false);
    const [activeTab, setActiveTab] = useState("1");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [requestResponse, reportResponse] = await Promise.all([
                    requestService.getRequestByUser(),
                    reportService.getReportsByUser()
                ]);
                setRequests(requestResponse.data || []);
                setReports(reportResponse.data || []);
            } catch (error) {
                message.error("Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
                {data.map((item, index) => (
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
                ))}
            </tbody>
        </table>
    );

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <h1 style={{
                fontSize: 24,
                fontWeight: 600,
                marginBottom: 24,
                color: '#333'
            }}>
                Request/Report Management
            </h1>

            <div style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)'
            }}>
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
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                                {isReport ? "Report Information" : "Request Information"}
                            </h3>
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
    );
};

export default RequestManager;