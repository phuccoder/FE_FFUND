import React, { useState, useEffect } from "react";
import { requestService } from "../../services/RequestService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import {
    ArrowUpIcon,
    ArrowDownIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";

const RequestManager = () => {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await requestService.getRequestByUser();
                setRequests(response.data || []);
            } catch (error) {
                console.error("Error fetching requests:", error);
                toast.error("Failed to fetch requests.");
            }
        };
        fetchRequests();
    }, []);

    const handleViewDetails = async (requestId) => {
        try {
            const response = await requestService.getRequestByRequestId(requestId);
            setSelectedRequest(response.data);
        } catch (error) {
            console.error("Error fetching request details:", error);
            toast.error("Failed to fetch request details.");
        }
    };

    const handleCloseDetails = () => {
        setSelectedRequest(null);
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

    // Tooltip component for sort explanation
    const SortTooltip = ({ text }) => (
        <div className="group relative inline-block">
            <InformationCircleIcon className="w-4 h-4 text-gray-400 ml-1 inline-block" />
            <span className="
                invisible group-hover:visible 
                absolute z-10 p-2 
                bg-black text-white text-xs 
                rounded shadow-lg 
                -top-10 left-1/2 transform -translate-x-1/2
            ">
                {text}
            </span>
        </div>
    );

    // Sortable header component
    const SortableHeader = ({ children, sortKey, tooltipText }) => (
        <th className="px-6 py-3 cursor-pointer">
            <div
                className="flex items-center gap-2"
                onClick={() => handleSort(sortKey)}
            >
                {children}
                {sortConfig.key === sortKey && (
                    sortConfig.direction === "asc"
                        ? <ArrowUpIcon className="w-4 h-4" />
                        : <ArrowDownIcon className="w-4 h-4" />
                )}
            </div>
            {tooltipText && (
                <SortTooltip text={tooltipText} />
            )}
        </th>
    );

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <ToastContainer />
            <h1 className="text-2xl font-bold mb-6">Request/Report Management</h1>

            {/* Table with sortable headers */}
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">STT</th>
                            <SortableHeader
                                sortKey="title"
                                tooltipText="Sort by title alphabetically"
                            >
                                Title
                            </SortableHeader>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Description</th>
                            <SortableHeader
                                sortKey="createdAt"
                                tooltipText="Sort by creation date"
                            >
                                Created At
                            </SortableHeader>
                            <SortableHeader
                                sortKey="status"
                                tooltipText="Sort by request status"
                            >
                                Status
                            </SortableHeader>
                            <th className="px-6 py-3">Response</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={request.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{index + 1}</td>
                                <td className="px-6 py-4">{request.title}</td>
                                <td className="px-6 py-4">{request.type}</td>
                                <td className="px-6 py-4 truncate max-w-xs">{request.description}</td>
                                <td className="px-6 py-4">{request.createdAt}</td>
                                <td className="px-6 py-4">{request.status}</td>
                                <td className="px-6 py-4">{request.response || "No response"}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleViewDetails(request.id)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Improved Request Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative"
                    >
                        <button
                            onClick={handleCloseDetails}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl"
                        >
                            ✖
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-center border-b pb-4">Request Details</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Request Information</h3>
                                <p className="mb-2"><strong>Title:</strong> {selectedRequest.title}</p>
                                <p className="mb-2"><strong>Type:</strong> {selectedRequest.type}</p>
                                <p className="mb-2"><strong>Status:</strong> {selectedRequest.status}</p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Timing</h3>
                                <p className="mb-2"><strong>Created At:</strong> {selectedRequest.createdAt}</p>
                                <p className="mb-2"><strong>Updated At:</strong> {selectedRequest.updatedAt || "N/A"}</p>
                            </div>

                            <div className="col-span-2">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Description</h3>
                                <p className="bg-gray-50 p-4 rounded">{selectedRequest.description}</p>
                            </div>

                            <div className="col-span-2">
                                <h3 className="font-semibold text-lg mb-2 text-gray-700">Response</h3>
                                <p className="bg-gray-50 p-4 rounded">
                                    {selectedRequest.response || "No response yet"}
                                </p>
                            </div>

                            {selectedRequest.attachmentUrl && (
                                <div className="col-span-2">
                                    <h3 className="font-semibold text-lg mb-2 text-gray-700">Attachment</h3>
                                    <a
                                        href={selectedRequest.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline bg-blue-50 px-4 py-2 rounded inline-block"
                                    >
                                        View Attachment
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RequestManager;