import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PayoutCard } from "@/components/Payout/PayoutCard";
import { ArrowRight, Eye, AlertTriangle, Clock } from 'lucide-react';
import { tokenManager } from "@/utils/tokenManager";
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { payoutService } from 'src/services/payoutService';
import projectService from 'src/services/projectService';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';

function PayoutPage() {
    const [payouts, setPayouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [projectPhases, setProjectPhases] = useState([]);
    const [phasesWithPayouts, setPhasesWithPayouts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const router = useRouter();
    const { projectId, phaseId } = router.query;
    const [projectPaymentInfo, setProjectPaymentInfo] = useState({});
    const [dashboardLoading, setDashboardLoading] = useState({});

    useEffect(() => {
        const fetchPayouts = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // First, check if we're handling a specific phase or project
                if (phaseId) {
                    // For a specific phase, fetch its payouts directly
                    const result = await payoutService.getPayoutByPhase(phaseId);

                    // If we have data for this phase, process it
                    if (result && result.data) {
                        const payoutData = result.data;
                        const validPayouts = Array.isArray(payoutData)
                            ? payoutData.filter(p => p && typeof p === 'object')
                            : (payoutData && typeof payoutData === 'object' ? [payoutData] : []);

                        setPayouts(validPayouts);

                        // If we have a valid payout, fetch the project details too
                        if (validPayouts.length > 0 && validPayouts[0].projectId) {
                            try {
                                const projectData = await projectService.getProjectById(validPayouts[0].projectId);
                                if (projectData) {
                                    setCurrentProject(projectData);
                                }

                                // Also fetch all phases for this project
                                const phases = await projectService.getPhaseByProject(validPayouts[0].projectId);
                                if (phases && phases.length > 0) {
                                    setProjectPhases(phases);

                                    // Mark the current phase as having payouts
                                    setPhasesWithPayouts([parseInt(phaseId)]);
                                }
                            } catch (projectErr) {
                                console.log('Error fetching project details:', projectErr);
                            }
                        }
                    } else {
                        try {
                            const allPhases = await projectService.getAllPhases();
                            const currentPhase = allPhases.find(p => p.id.toString() === phaseId.toString());

                            if (currentPhase && currentPhase.projectId) {
                                const projectData = await projectService.getProjectById(currentPhase.projectId);
                                setCurrentProject(projectData);

                                const phases = await projectService.getPhaseByProject(currentPhase.projectId);
                                if (phases && phases.length > 0) {
                                    setProjectPhases(phases);
                                }
                            }
                        } catch (phaseErr) {
                            console.log('Error fetching phase details:', phaseErr);
                        }

                        setPayouts([]);
                    }
                } else if (projectId) {
                    const projectData = await projectService.getProjectById(projectId);
                    if (projectData) {
                        setCurrentProject(projectData);
                    }

                    const phases = await projectService.getPhaseByProject(projectId);
                    if (!phases || phases.length === 0) {
                        setProjectPhases([]);
                        setPayouts([]);
                        return;
                    }

                    setProjectPhases(phases);

                    let allProjectPayouts = [];
                    let phasesWithPayoutsList = [];

                    for (const phase of phases) {
                        try {
                            const phaseResult = await payoutService.getPayoutByPhase(phase.id);

                            if (phaseResult && phaseResult.data) {
                                const payoutData = Array.isArray(phaseResult.data)
                                    ? phaseResult.data
                                    : [phaseResult.data];

                                if (payoutData.length > 0) {

                                    const enhancedPayouts = payoutData.map(payout => ({
                                        ...payout,
                                        phaseStatus: phase.status,
                                        phaseStartDate: phase.startDate,
                                        phaseEndDate: phase.endDate,
                                        targetAmount: phase.targetAmount,
                                        raiseAmount: phase.raiseAmount,
                                        phaseNumber: phase.phaseNumber
                                    }));

                                    allProjectPayouts = [...allProjectPayouts, ...enhancedPayouts];
                                    phasesWithPayoutsList.push(phase.id);
                                }
                            }
                        } catch (err) {
                            console.log(`No payouts found for phase ${phase.id}`);
                        }
                    }

                    setPayouts(allProjectPayouts);
                    setPhasesWithPayouts(phasesWithPayoutsList);
                } else {
                    const projectsData = await projectService.getProjectsByFounder();
                    if (!projectsData || projectsData.length === 0) {
                        setProjects([]);
                        setPayouts([]);
                        return;
                    }

                    const projectsList = Array.isArray(projectsData) ? projectsData : [projectsData];
                    setProjects(projectsList);

                    let allPayouts = [];
                    let phasesWithPayoutsList = [];

                    for (const project of projectsList) {
                        try {
                            const phases = await projectService.getPhaseByProject(project.id);

                            if (phases && phases.length > 0) {
                                for (const phase of phases) {
                                    try {
                                        const phaseResult = await payoutService.getPayoutByPhase(phase.id);

                                        if (phaseResult && phaseResult.data) {
                                            const payoutData = Array.isArray(phaseResult.data)
                                                ? phaseResult.data
                                                : [phaseResult.data];

                                            if (payoutData.length > 0) {
                                                const projectPayouts = payoutData
                                                    .filter(p => p && typeof p === 'object')
                                                    .map(payout => ({
                                                        ...payout,
                                                        projectTitle: project.title || payout.projectTitle,
                                                        phaseStatus: phase.status,
                                                        phaseStartDate: phase.startDate,
                                                        phaseEndDate: phase.endDate,
                                                        phaseNumber: phase.phaseNumber
                                                    }));

                                                allPayouts = [...allPayouts, ...projectPayouts];
                                                phasesWithPayoutsList.push(phase.id);
                                            }
                                        }
                                    } catch (phaseErr) {
                                        console.log(`No payouts found for phase ${phase.id}`);
                                    }
                                }
                            }
                        } catch (projectErr) {
                            console.log(`Error fetching phases for project ${project.id}:`, projectErr);
                        }
                    }

                    setPayouts(allPayouts);
                    setPhasesWithPayouts(phasesWithPayoutsList);
                }
            } catch (err) {
                console.error('Error fetching payouts:', err);
                setError(err.message || 'An error occurred while fetching payouts');
                setPayouts([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (router.isReady) {
            fetchPayouts();
        }
    }, [projectId, phaseId, router.isReady]);

    useEffect(() => {
        const fetchProjectPaymentInfo = async () => {
            const uniqueProjectIds = Object.values(payoutsByProject).map(summary => summary.projectId);
            const paymentInfoMap = {};

            for (const projectId of uniqueProjectIds) {
                if (projectId) {
                    try {
                        const paymentInfo = await paymentInfoService.getPaymentInfo(projectId);
                        if (paymentInfo) {
                            paymentInfoMap[projectId] = paymentInfo;
                        }
                    } catch (err) {
                        console.error(`Error fetching payment info for project ${projectId}:`, err);
                    }
                }
            }

            setProjectPaymentInfo(paymentInfoMap);
        };
        if (Object.keys(payoutsByProject).length > 0) {
            fetchProjectPaymentInfo();
        }
    }, [payoutsByProject]);

    // Group payouts by project
    const payoutsByProject = payouts.reduce((acc, payout) => {
        if (!payout || !payout.projectId) return acc;

        if (!acc[payout.projectId]) {
            acc[payout.projectId] = {
                projectId: payout.projectId,
                projectTitle: payout.projectTitle || 'Unknown Project',
                payouts: [],
                totalAmount: 0,
                payoutCount: 0
            };
        }

        acc[payout.projectId].payouts.push(payout);
        acc[payout.projectId].totalAmount += typeof payout.amount === 'number' ? payout.amount : 0;
        acc[payout.projectId].payoutCount += 1;

        return acc;
    }, {});

    const visiblePhases = phaseId
        ? projectPhases
        : projectPhases.filter(phase => phasesWithPayouts.includes(phase.id));

    const handleViewDetails = (payout) => {
        setSelectedPayout(payout);
        setShowDetailModal(true);
    };

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '$0.00';
        return `$${amount.toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderPhaseStatus = (status) => {
        if (!status) return null;

        const statusColors = {
            'COMPLETED': 'bg-green-100 text-green-800',
            'ACTIVE': 'bg-blue-100 text-blue-800',
            'PLAN': 'bg-yellow-100 text-yellow-800',
            'CANCELLED': 'bg-red-100 text-red-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const handleViewDashboard = async (projectId) => {
        try {
            if (!projectPaymentInfo[projectId]) {
                throw new Error("Payment information not available for this project");
            }

            const paymentInfoId = projectPaymentInfo[projectId].id;
            setDashboardLoading(prev => ({ ...prev, [projectId]: true }));

            const response = await paymentInfoService.createDashboardLink(paymentInfoId);

            if (response && response.data) {
                // Open the dashboard URL in a new tab
                window.open(response.data, '_blank');
            } else {
                throw new Error("Could not generate dashboard link");
            }
        } catch (err) {
            console.error("Error opening Stripe dashboard:", err);
            alert(`Error: ${err.message || "Failed to open Stripe dashboard"}`);
        } finally {
            setDashboardLoading(prev => ({ ...prev, [projectId]: false }));
        }
    };

    return (
        <>
            <Layout>
                <Header />
                <PageTitle title="Payouts" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Project context when viewing a specific project */}
                    {!isLoading && !error && currentProject && (
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{currentProject.title}</h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {currentProject.description && currentProject.description.length > 100
                                            ? `${currentProject.description.substring(0, 100)}...`
                                            : currentProject.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Project phases overview - show for specific project view, only phases with payouts */}
                    {!isLoading && !error && visiblePhases.length > 0 && (projectId || phaseId) && (
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {visiblePhases.length === projectPhases.length
                                        ? "Project Phases"
                                        : "Phases with Payouts"}
                                </h2>

                                {visiblePhases.length < projectPhases.length && (
                                    <button
                                        onClick={() => router.push(`/projects/${currentProject.id}`)}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        View All Phases <ArrowRight className="ml-1 h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visiblePhases.map((phase, index) => (
                                    <div
                                        key={phase.id}
                                        className={`border rounded-lg shadow-sm overflow-hidden ${phaseId && phase.id.toString() === phaseId.toString()
                                            ? 'ring-2 ring-orange-500'
                                            : phasesWithPayouts.includes(phase.id)
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium text-gray-700">Phase {phase.phaseNumber}</h3>
                                                {renderPhaseStatus(phase.status)}
                                            </div>
                                        </div>

                                        <div className="px-4 py-3">
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Target</p>
                                                    <p className="font-medium">{formatCurrency(phase.targetAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Raised</p>
                                                    <p className="font-medium">{formatCurrency(phase.raiseAmount)}</p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500">Duration</p>
                                                <p className="text-sm">{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</p>
                                            </div>

                                            <div className="mt-4 flex justify-between">
                                                <div className="text-sm">
                                                    <span className="text-gray-500">Investors: </span>
                                                    <span className="font-medium">{phase.totalInvestors || 0}</span>
                                                </div>

                                                <button
                                                    onClick={() => router.push(`/payout?phaseId=${phase.id}`)}
                                                    className={`text-sm font-medium ${phaseId && phase.id.toString() === phaseId.toString()
                                                        ? 'text-orange-600'
                                                        : 'text-blue-600 hover:text-blue-800'
                                                        }`}
                                                >
                                                    {phaseId && phase.id.toString() === phaseId.toString()
                                                        ? 'Currently Viewing'
                                                        : phasesWithPayouts.includes(phase.id)
                                                            ? 'View Payouts'
                                                            : 'No Payouts Yet'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Cards - only on main page */}
                    {!isLoading && !error && payouts.length > 0 && !projectId && !phaseId && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payout Summary by Project</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.values(payoutsByProject).map(summary => (
                                    <div
                                        key={summary.projectId}
                                        className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 shadow-sm"
                                    >
                                        <h3 className="font-medium text-gray-800 mb-2 truncate" title={summary.projectTitle}>
                                            {summary.projectTitle}
                                        </h3>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Amount</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatCurrency(summary.totalAmount)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Payouts</p>
                                                <p className="text-lg font-medium text-gray-800">{summary.payoutCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Display payouts */}
                    {!isLoading && !error && (
                        <>
                            {payouts.length > 0 ? (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                        {phaseId
                                            ? `Payouts for Phase ${payouts[0]?.phaseNumber || ''}`
                                            : projectId
                                                ? `Payouts for ${currentProject?.title || 'This Project'}`
                                                : 'Recent Payouts'}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {payouts.map(payout => (
                                            <div key={payout.id || Math.random()} className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                                <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 px-6 py-4">
                                                    <h3 className="text-white font-bold text-lg">Payout Summary</h3>
                                                </div>

                                                <div className="p-6">
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold text-gray-700 text-lg">{payout.projectTitle || 'Unknown Project'}</h4>
                                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                                                Phase {payout.phaseNumber || '?'}
                                                            </span>
                                                            {payout.phaseStatus && (
                                                                <span className="ml-2">
                                                                    {renderPhaseStatus(payout.phaseStatus)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Amount</p>
                                                            <p className="font-medium text-gray-800">
                                                                {formatCurrency(payout.amount)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">Payout Date</p>
                                                            <p className="font-medium text-gray-800">
                                                                {payout.payoutDate ? formatDate(payout.payoutDate) : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleViewDetails(payout)}
                                                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    {projectPhases.length > 0 ? (
                                        <div className="text-center">
                                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                                                <Clock className="h-6 w-6 text-yellow-600" />
                                            </div>
                                            <h3 className="mt-3 text-lg font-medium text-gray-900">No Payouts Available Yet</h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                {phaseId
                                                    ? `This phase doesn't have any payouts processed yet.`
                                                    : `This project has ${projectPhases.length} phase(s), but no payouts have been processed yet.`}
                                            </p>

                                            {projectPhases.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-700">Project Phases</p>
                                                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                                                        {projectPhases.map(phase => (
                                                            <span key={phase.id} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-800">
                                                                Phase {phase.phaseNumber}: {phase.status}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                                                <AlertTriangle className="h-6 w-6 text-gray-600" />
                                            </div>
                                            <h3 className="mt-3 text-lg font-medium text-gray-900">No Payouts Found</h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                There are no payouts available for this project yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
                            <p className="font-medium">Error loading payouts</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Modal for detailed view */}
                    {showDetailModal && selectedPayout && (
                        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Payout Details</h2>

                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{selectedPayout.projectTitle}</h3>
                                                <p className="text-sm text-gray-500">Phase {selectedPayout.phaseNumber}</p>
                                            </div>
                                            {selectedPayout.phaseStatus && (
                                                <div>
                                                    {renderPhaseStatus(selectedPayout.phaseStatus)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Payout ID</p>
                                            <p className="font-medium">{selectedPayout.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Payout Date</p>
                                            <p className="font-medium">{formatDate(selectedPayout.payoutDate)}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="font-medium text-gray-700 mb-3">Financial Details</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Amount</p>
                                                <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPayout.amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Platform Fee</p>
                                                <p className="font-medium">{formatCurrency(selectedPayout.stripe_fee || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Net Profit</p>
                                                <p className="font-medium">{formatCurrency(selectedPayout.profit || selectedPayout.amount)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPayout.targetAmount && selectedPayout.raiseAmount && (
                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                            <h4 className="font-medium text-gray-700 mb-3">Phase Performance</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Target Amount</p>
                                                    <p className="font-medium">{formatCurrency(selectedPayout.targetAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Raised Amount</p>
                                                    <p className="font-medium">{formatCurrency(selectedPayout.raiseAmount)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-500">Funding Progress</p>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                                    <div
                                                        className="bg-green-600 h-2.5 rounded-full"
                                                        style={{ width: `${Math.min(100, (selectedPayout.raiseAmount / selectedPayout.targetAmount) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {Math.round((selectedPayout.raiseAmount / selectedPayout.targetAmount) * 100)}% of target reached
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>
        </>
    );
}

export default function Payout() {
    return (
        <ProtectedRoute requiredRoles={['FOUNDER']}>
            <PayoutPage />
        </ProtectedRoute>
    );
}