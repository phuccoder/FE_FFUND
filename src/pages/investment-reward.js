import React, { useState, useEffect } from 'react';
import { investmentRewardService } from '../services/investmentRewardService';
import { milestoneService } from 'src/services/milestoneService';
import { FaEye, FaCheckCircle, FaExclamationCircle, FaClock } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';
import { shippingInformationService } from 'src/services/shippingInformationService';
import projectService from 'src/services/projectService';
import { toast } from 'react-toastify';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function InvestmentReward() {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedReward, setSelectedReward] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showMilestoneTooltip, setShowMilestoneTooltip] = useState(false);
    const [confirmingReceiptId, setConfirmingReceiptId] = useState(null);

    // Advanced Search States
    const [phases, setPhases] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [searchParams, setSearchParams] = useState({
        phaseNumber: '',
        milestoneTitle: '',
        investorName: '',
        sort: '+createdAt',
    });

    useEffect(() => {
        fetchRewards();
        fetchPhases();
    }, [currentPage, searchParams]);

    const fetchRewards = async () => {
        setLoading(true);
        setError('');
        try {
            const query = [
                searchParams.phaseNumber && `phase.phaseNumber:eq:${searchParams.phaseNumber}`,
                searchParams.milestoneTitle && `milestone.title:eq:${searchParams.milestoneTitle}`,
                searchParams.investorName && `user.fullName:eq:${searchParams.investorName}`,
            ]
                .filter(Boolean)
                .join(',');

            const response = await investmentRewardService.getInvestmentRewardByProjectId(currentPage, 10, {
                query,
                sort: searchParams.sort,
            });
            setRewards(response.data);
            setTotalPages(response.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPhases = async () => {
        try {
            // Lấy dự án hiện tại của founder
            const currentProject = await projectService.getCurrentProjectByFounder();
            const projectId = currentProject.id || currentProject.data?.id;

            if (!projectId) {
                console.error('No project ID available from current project data');
                setError('Could not determine project ID. Please try again later.');
                return;
            }

            // Gọi API lấy phases theo projectId
            const response = await investmentRewardService.getFundingPhaseByProjectId(projectId);
            const phaseData = response.data.map((phase) => ({
                id: phase.id,
                phaseNumber: phase.phaseNumber,
                status: phase.status
            }));
            setPhases(phaseData);
        } catch (err) {
            console.error('Failed to fetch phases:', err);
            setError('Failed to load project phases. Please try again later.');
        }
    };

    const fetchMilestones = async (phaseId) => {
        try {
            const response = await milestoneService.getMilestonesByPhaseId(phaseId);
            const milestoneData = response.data.map((milestone) => ({
                id: milestone.id,
                title: milestone.title,
            }));
            setMilestones(milestoneData);
        } catch (err) {
            console.error('Failed to fetch milestones:', err);
        }
    };

    const handlePhaseChange = (e) => {
        const phaseNumber = e.target.value;

        if (!phaseNumber) {
            setSearchParams((prev) => ({
                ...prev,
                phaseNumber: '',
                milestoneTitle: '',
            }));
            setMilestones([]);
        } else {
            setSearchParams((prev) => ({ ...prev, phaseNumber }));
            const selectedPhase = phases.find((phase) => phase.phaseNumber === parseInt(phaseNumber));
            if (selectedPhase) fetchMilestones(selectedPhase.id);
        }
    };

    const handleConfirmShipping = async (shippingId) => {
        try {
            await investmentRewardService.confirmShippingItem(shippingId);
            alert('Shipping item confirmed successfully!');
            fetchRewards();
        } catch (error) {
            console.error('Failed to confirm shipping item:', error);
            alert('Failed to confirm shipping item. Please try again.');
        }
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams((prev) => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (e) => {
        setSearchParams((prev) => ({ ...prev, sort: e.target.value }));
    };

    const handleViewDetails = (reward) => {
        setSelectedReward(reward);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedReward(null);
    };

    const handleConfirmReceipt = async (shippingId) => {
        if (!shippingId) {
            alert('No shipping information available for this investment');
            return;
        }

        try {
            setConfirmingReceiptId(shippingId);
            await shippingInformationService.confirmReceived(shippingId);
            toast.success('Package confirmed as received!');
            fetchRewards(); // Refresh the data after confirmation
        } catch (err) {
            console.error('Failed to confirm receipt:', err);
            toast.error('Failed to confirm receipt. Please try again.');
        } finally {
            setConfirmingReceiptId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <span className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaCheckCircle className="mr-1" /> Paid
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <FaClock className="mr-1" /> Pending
                    </span>
                );
            default:
                return (
                    <span className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <FaExclamationCircle className="mr-1" /> {status}
                    </span>
                );
        }
    };

    return (
        <Layout>
            <Header />
            <div className="bg-gradient-to-r from-orange-50 to-green-50">
                <div className="container mx-auto py-8 px-4">
                    <PageTitle title="Investment Reward" />
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        {/* Header Section - Removed bottom margin to eliminate gap */}
                        <div className="bg-gradient-to-r from-orange-500 to-green-500 px-6 py-5">
                            <h2 className="text-yellow-500 text-2xl font-bold">Manage Investment Rewards</h2>
                            <p className="text-yellow-500 opacity-90 text-lg">
                                Review and confirm shipping for milestones. Ensure all milestones in the current phase are completed.
                            </p>
                        </div>

                        {phases.some((phase) => phase.status === 'PROCESS') && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                                <p className="font-bold">Important Notice</p>
                                <p>
                                    Please complete all milestones in the current phase (Phase {phases.find((phase) => phase.status === 'PROCESS')?.phaseNumber}) before proceeding with other actions.
                                </p>
                            </div>
                        )}

                        {/* Advanced Search Section - Improved styling with more prominent design */}
                        <div className="p-8 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-gray-700 font-semibold text-lg mb-4">Advanced Search</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm h-12"
                                        value={searchParams.phaseNumber}
                                        onChange={handlePhaseChange}
                                    >
                                        <option value="">All Phases</option>
                                        {phases.map((phase) => (
                                            <option key={phase.id} value={phase.phaseNumber}>
                                                Phase {phase.phaseNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Milestone selection with custom tooltip */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Milestone</label>
                                    <div
                                        className="relative"
                                        onMouseEnter={() => !searchParams.phaseNumber && setShowMilestoneTooltip(true)}
                                        onMouseLeave={() => setShowMilestoneTooltip(false)}
                                    >
                                        <select
                                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm h-12 ${!searchParams.phaseNumber ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            name="milestoneTitle"
                                            value={searchParams.milestoneTitle}
                                            onChange={handleSearchChange}
                                            disabled={!searchParams.phaseNumber}
                                        >
                                            <option value="">All Milestones</option>
                                            {milestones.map((milestone) => (
                                                <option key={milestone.id} value={milestone.title}>
                                                    {milestone.title}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Custom tooltip */}
                                        {showMilestoneTooltip && !searchParams.phaseNumber && (
                                            <div className="absolute z-10 w-48 -left-1 -top-12 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                                                <div className="flex items-center">
                                                    <FaExclamationCircle className="mr-2 text-yellow-400" />
                                                    <span>Please select a Phase first</span>
                                                </div>
                                                {/* Arrow pointing to the select */}
                                                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-gray-800 transform rotate-45"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Investor Name</label>
                                    <input
                                        type="text"
                                        name="investorName"
                                        value={searchParams.investorName}
                                        onChange={handleSearchChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm h-12"
                                        placeholder="Search by name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm h-12"
                                        value={searchParams.sort}
                                        onChange={handleSortChange}
                                    >
                                        <option value="+createdAt">Created At (Asc)</option>
                                        <option value="-createdAt">Created At (Desc)</option>
                                        <option value="+phase.phaseNumber">Phase (Asc)</option>
                                        <option value="-phase.phaseNumber">Phase (Desc)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Added search button */}
                            <div className="flex justify-end mt-4">
                                <button
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-md hover:opacity-90 transition-all font-medium flex items-center"
                                    onClick={fetchRewards}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Table Section - Kept the same */}
                        <div className="p-6">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                                    <p className="font-bold">Error</p>
                                    <p>{error}</p>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                                                <th className="px-6 py-3 rounded-tl-lg">Investment ID</th>
                                                <th className="px-6 py-3">Investor</th>
                                                <th className="px-6 py-3">Email</th>
                                                <th className="px-6 py-3">Milestone</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3 rounded-tr-lg text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rewards.map((reward) => (
                                                <tr key={reward.investmentId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        #{reward.investmentId}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">{reward.investorFullName}</td>
                                                    <td className="px-6 py-4 text-gray-600">{reward.investorEmail}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                                                            {reward.milestoneResponse.title}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{getStatusBadge(reward.status)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center items-center space-x-2">
                                                            <button
                                                                onClick={() => handleViewDetails(reward)}
                                                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors flex items-center"
                                                                title="View Details"
                                                            >
                                                                <FaEye />
                                                            </button>

                                                            {/* Show confirm shipping button if not yet shipped or received */}
                                                            {reward.shippingInformation &&
                                                                reward.shippingInformation.status === 'PENDING' && (
                                                                    <button
                                                                        onClick={() => handleConfirmShipping(reward.shippingInformation?.id)}
                                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors flex items-center"
                                                                        title="Confirm that the shipping item has been sent"
                                                                        disabled={!reward.shippingInformation?.id}
                                                                    >
                                                                        <FaCheckCircle />
                                                                    </button>
                                                                )}

                                                            {/* Add confirm receipt button that shows only for items with DELIVERY status */}
                                                            {reward.shippingInformation && reward.shippingInformation.status === 'DELIVERY' && (
                                                                <button
                                                                    onClick={() => handleConfirmReceipt(reward.shippingInformation?.id)}
                                                                    className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors flex items-center"
                                                                    title="Confirm receipt of package"
                                                                    disabled={confirmingReceiptId === reward.shippingInformation?.id}
                                                                >
                                                                    {confirmingReceiptId === reward.shippingInformation?.id ? (
                                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {rewards.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                        No investment rewards found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-6">
                                <button
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md disabled:opacity-50 hover:bg-orange-200 transition-colors flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage + 1} of {totalPages || 1}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages - 1}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                                    className="px-4 py-2 bg-green-100 text-green-700 rounded-md disabled:opacity-50 hover:bg-green-200 transition-colors flex items-center"
                                >
                                    Next
                                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal - More compact design, wider horizontally and less vertical padding */}
            {showModal && selectedReward && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-y-auto" style={{ zIndex: 41 }}>
                        <div className="bg-gradient-to-r from-orange-500 to-green-500 px-6 py-3 flex justify-between items-center rounded-t-xl">
                            <h3 className="text-white text-xl font-bold">Investment Reward Details</h3>
                            <button
                                onClick={closeModal}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <IoClose size={24} />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <div className="flex flex-wrap -mx-2">
                                {/* Investor Shipping Information */}
                                <div className="w-full md:w-1/2 px-2 mb-4">
                                    <div className="w-full md:w-1/2 px-2 mb-4">
                                        <div className="bg-orange-50 p-4 rounded-lg h-full">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Investor Shipping Information</h4>

                                            {!selectedReward.shippingInformation ||
                                                (!selectedReward.shippingInformation.investorName &&
                                                    !selectedReward.shippingInformation.investorEmail &&
                                                    !selectedReward.shippingInformation.investorPhone) ? (
                                                // Show notification when shipping information is missing
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                                    <div className="flex items-center">
                                                        <FaExclamationCircle className="text-yellow-400 mr-2" />
                                                        <p className="text-sm text-yellow-700">
                                                            No shipping information has been provided by the investor yet.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Show shipping details when available
                                                <>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {selectedReward.shippingInformation?.investorName && (
                                                            <div>
                                                                <p className="text-sm text-gray-500">Name</p>
                                                                <p className="font-medium">{selectedReward.shippingInformation.investorName}</p>
                                                            </div>
                                                        )}

                                                        {selectedReward.shippingInformation?.investorEmail && (
                                                            <div>
                                                                <p className="text-sm text-gray-500">Email</p>
                                                                <p className="font-medium">{selectedReward.shippingInformation.investorEmail}</p>
                                                            </div>
                                                        )}

                                                        {selectedReward.shippingInformation?.investorPhone && (
                                                            <div>
                                                                <p className="text-sm text-gray-500">Phone</p>
                                                                <p className="font-medium">{selectedReward.shippingInformation.investorPhone}</p>
                                                            </div>
                                                        )}

                                                        {selectedReward.shippingInformation?.status && (
                                                            <div>
                                                                <p className="text-sm text-gray-500">Status</p>
                                                                <p className="font-medium">{selectedReward.shippingInformation.status}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {selectedReward.shippingInformation?.userAddress ? (
                                                        <div className="bg-white p-3 rounded border border-orange-100 mt-3">
                                                            <p className="text-sm text-gray-500 mb-1">Address</p>
                                                            <p className="font-medium">{selectedReward.shippingInformation.userAddress.address}</p>
                                                            <p className="text-sm">
                                                                {selectedReward.shippingInformation.userAddress.ward}, {selectedReward.shippingInformation.userAddress.district}, {selectedReward.shippingInformation.userAddress.province}
                                                            </p>
                                                            {selectedReward.shippingInformation.userAddress.note && (
                                                                <p className="mt-1 text-sm text-gray-600 italic">Note: {selectedReward.shippingInformation.userAddress.note}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-3">
                                                            <p className="text-sm text-gray-500 flex items-center">
                                                                <FaExclamationCircle className="text-gray-400 mr-2" />
                                                                No address information available
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Milestone Items */}
                                <div className="w-full md:w-1/2 px-2">
                                    <div className="bg-green-50 p-4 rounded-lg h-full">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Milestone Items</h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Milestone</p>
                                                <p className="font-medium text-orange-700">{selectedReward.milestoneResponse?.title || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Price</p>
                                                <p className="font-medium">${selectedReward.milestoneResponse?.price || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Description</p>
                                            <p className="text-sm text-gray-700">{selectedReward.milestoneResponse?.description || 'N/A'}</p>
                                        </div>

                                        {selectedReward.milestoneResponse?.items && selectedReward.milestoneResponse.items.length > 0 && (
                                            <div className="mt-3">
                                                <h5 className="text-sm font-medium text-gray-800 mb-2">Reward Items</h5>
                                                <div className="flex space-x-3 overflow-x-auto pb-2">
                                                    {selectedReward.milestoneResponse.items.map((item) => (
                                                        <div key={item.id} className="flex-shrink-0 w-36 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                            {item.imageUrl && (
                                                                <div className="h-28 overflow-hidden">
                                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <div className="p-2">
                                                                <h5 className="font-medium text-sm">{item.name}</h5>
                                                                <div className="flex justify-between items-center mt-1">
                                                                    <span className="text-xs text-gray-500">Quantity</span>
                                                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">{item.quantity}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                                {selectedReward.shippingInformation && selectedReward.shippingInformation.status === 'DELIVERY' && (
                                    <button
                                        onClick={() => {
                                            handleConfirmReceipt(selectedReward.shippingInformation?.id);
                                            closeModal();
                                        }}
                                        disabled={confirmingReceiptId === selectedReward.shippingInformation?.id}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center"
                                    >
                                        {confirmingReceiptId === selectedReward.shippingInformation?.id ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Confirm Receipt of Package
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default function InvestmentRewardPage() {
    return (
        <ProtectedRoute requiredRoles={["FOUNDER"]}>
            <InvestmentReward />
        </ProtectedRoute>
    );
}