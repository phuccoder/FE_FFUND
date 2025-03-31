import React, { useState, useEffect } from "react";
import { requestService } from "../../services/RequestService";
import { message, Modal } from "antd";
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    InfoCircleOutlined,
    EyeOutlined,
    CloseOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import Header from '@/components/Header/Header';
import Layout from '@/components/Layout/Layout';
import Head from 'next/head';
import { format } from 'date-fns';

const { confirm } = Modal;

const RequestManager = () => {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const response = await requestService.getRequestByUser();
                setRequests(response.data || []);
            } catch (error) {
                message.error("Failed to fetch requests.");
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const handleViewDetails = async (requestId) => {
        try {
            const response = await requestService.getRequestByRequestId(requestId);
            setSelectedRequest(response.data);
            setModalVisible(true);
        } catch (error) {
            message.error("Failed to fetch request details.");
        }
    };

    const handleCloseDetails = () => {
        setModalVisible(false);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedData = [...requests].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setRequests(sortedData);
    };

    const getStatusTag = (status) => {
        let color = '';
        switch (status.toLowerCase()) {
            case 'pending': color = 'orange'; break;
            case 'approved': color = 'green'; break;
            case 'rejected': color = 'red'; break;
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
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#fafafa' }}>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontWeight: 500,
                                width: 50
                            }}>No.</th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleSort('title')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    Title
                                    <SortIndicator sortKey="title" />
                                </div>
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Type</th>
                            <th
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleSort('createdAt')}
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
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleSort('status')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    Status
                                    <SortIndicator sortKey="status" />
                                </div>
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={request.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                                <td style={{ padding: '12px 16px' }}>{request.title}</td>
                                <td style={{ padding: '12px 16px' }}>{request.type}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    {format(new Date(request.createdAt), 'dd MMM yyyy HH:mm')}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    {getStatusTag(request.status)}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <button
                                        onClick={() => handleViewDetails(request.id)}
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
            </div>

            <Modal
                title="Request Details"
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
                {selectedRequest && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Request Information</h3>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div>
                                    <strong>Title:</strong> {selectedRequest.title}
                                </div>
                                <div>
                                    <strong>Type:</strong> {selectedRequest.type}
                                </div>
                                <div>
                                    <strong>Status:</strong> {getStatusTag(selectedRequest.status)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Timing</h3>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div>
                                    <strong>Created At:</strong>{' '}
                                    {format(new Date(selectedRequest.createdAt), 'dd MMM yyyy HH:mm')}
                                </div>
                                <div>
                                    <strong>Updated At:</strong>{' '}
                                    {selectedRequest.updatedAt
                                        ? format(new Date(selectedRequest.updatedAt), 'dd MMM yyyy HH:mm')
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
                                {selectedRequest.description}
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
                                {selectedRequest.response || "No response yet"}
                            </div>
                        </div>

                        {selectedRequest.attachmentUrl && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Attachment</h3>
                                <button
                                    onClick={() => window.open(selectedRequest.attachmentUrl, '_blank')}
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