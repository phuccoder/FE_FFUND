import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Header/Header';
import projectService from 'src/services/projectService';
import InvestmentTable from '@/components/FounderInvestment/InvestmentTable';
import InvestmentFilterSort from '@/components/FounderInvestment/InvestmentFilterSort';
import PageTitle from '@/components/Reuseable/PageTitle';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];

    // Calculate range of pages to show
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // Ensure we always show 5 pages if possible
    if (endPage - startPage < 4) {
        if (startPage === 0) {
            endPage = Math.min(totalPages - 1, startPage + 4);
        } else if (endPage === totalPages - 1) {
            startPage = Math.max(0, endPage - 4);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex justify-center mt-6">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* Previous Page Button */}
                <button
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${currentPage === 0
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Page Numbers */}
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={`relative inline-flex items-center px-4 py-2 border ${number === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {number + 1}
                    </button>
                ))}

                {/* Next Page Button */}
                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${currentPage === totalPages - 1
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </nav>
        </div>
    );
};

const FounderInvestments = () => {
    const router = useRouter();
    const { investmentId } = router.query;
    // Project and phase data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);
    const [phases, setPhases] = useState([]);
    const [selectedPhaseId, setSelectedPhaseId] = useState(null);

    // Investments data
    const [investments, setInvestments] = useState([]);
    const [loadingInvestments, setLoadingInvestments] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalInvestments, setTotalInvestments] = useState(0);

    // Filtering and sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortField, setSortField] = useState('investmentDate');
    const [sortDirection, setSortDirection] = useState('desc');

    // Format currency utility function
    const formatCurrency = (value) => {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
    };

    // Fetch current project if no projectId is provided
    const fetchCurrentProject = useCallback(async () => {
        try {
            console.log("No projectId in query params, fetching current project");
            const currentProject = await projectService.getCurrentProjectByFounder();

            if (currentProject && currentProject.id) {
                console.log("Current project fetched:", currentProject);
                return currentProject.id;
            } else {
                setError("No active project found. Please create a project first.");
                return null;
            }
        } catch (err) {
            console.error("Error fetching current project:", err);
            setError("Failed to load project data. " + (err.message || "Please try again later."));
            return null;
        }
    }, []);

    // Fetch project and phases
    useEffect(() => {
        async function loadProjectData() {
            if (!router.isReady) {
                return;
            }

            try {
                setLoading(true);

                // Determine the project ID to use
                let projectId = router.query.projectId;

                // If no projectId in query params, fetch current project
                if (!projectId) {
                    projectId = await fetchCurrentProject();

                    if (!projectId) {
                        setLoading(false);
                        return;
                    }
                }

                console.log("Fetching project data for ID:", projectId);

                // Fetch project data
                const projectData = await projectService.getProjectById(projectId);
                console.log("Project data:", projectData);
                setProject(projectData);

                // Fetch phases for this project
                console.log("Fetching phases for project ID:", projectId);
                const phasesData = await projectService.getPhaseByProject(projectId);
                console.log("Phases data:", phasesData);

                if (Array.isArray(phasesData)) {
                    setPhases(phasesData);

                    // Determine which phase to select initially
                    const initialPhaseId = router.query.phaseId;
                    if (initialPhaseId) {
                        setSelectedPhaseId(initialPhaseId);
                    } else if (phasesData.length > 0) {
                        setSelectedPhaseId(phasesData[0].id);
                    }
                } else {
                    console.error("Phases data is not an array:", phasesData);
                    setPhases([]);
                    setError("Failed to load project phases. Unexpected data format.");
                }

            } catch (err) {
                console.error("Error fetching project data:", err);
                setError("Failed to load project data. " + (err.message || "Please try again later."));
            } finally {
                setLoading(false);
            }
        }

        loadProjectData();
    }, [router.isReady, router.query, fetchCurrentProject]);

    const fetchInvestments = useCallback(async (page = 0) => {
        if (!selectedPhaseId) {
            console.log("No phase ID selected, skipping investment fetch");
            return;
        }

        try {
            setLoadingInvestments(true);
            console.log("Fetching investments for phase ID:", selectedPhaseId);

            const params = {
                page,
                size: pageSize,
                sort: `${sortDirection === 'desc' ? '-' : '+'}${sortField}`,
                query: searchQuery,
                status: statusFilter
            };

            console.log("Using params:", params);

            const response = await projectService.getInvestmentByPhaseId(selectedPhaseId, params);
            console.log("Processed API response:", response);

            if (response && response.data) {
                const investmentsArray = response.data.data || [];
                setInvestments(investmentsArray);

                setCurrentPage(response.data.currentPage || 0);
                setTotalPages(response.data.totalPages || 1);
                setTotalInvestments(response.data.totalElements || 0);

                console.log("Successfully set investments data:", {
                    count: (response.data.data || []).length,
                    currentPage: response.data.currentPage,
                    totalPages: response.data.totalPages
                });
            } else {
                console.warn("No data in response or unexpected format:", response);
                setInvestments([]);
                setCurrentPage(0);
                setTotalPages(1);
                setTotalInvestments(0);
            }

        } catch (err) {
            console.error("Error fetching investments:", err);
            setError("Failed to load investments. " + (err.message || "Please try again later."));
            setInvestments([]);
        } finally {
            setLoadingInvestments(false);
        }
    }, [selectedPhaseId, pageSize, sortField, sortDirection, searchQuery, statusFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        if (selectedPhaseId) {
            console.log("Filters changed, resetting to page 0 and fetching investments");
            setCurrentPage(0);
            fetchInvestments(0);
        }
    }, [selectedPhaseId]);

    // Separately handle filter changes to avoid too many dependencies in the above effect
    useEffect(() => {
        if (selectedPhaseId) {
            const timer = setTimeout(() => {
                console.log("Filter/sort changed, fetching investments");
                setCurrentPage(0);
                fetchInvestments(0);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [sortField, sortDirection, searchQuery, statusFilter]);

    // Handle phase selection change
    const handlePhaseChange = (e) => {
        const newPhaseId = e.target.value;
        console.log("Phase changed to:", newPhaseId);
        setSelectedPhaseId(newPhaseId);

        // Update URL without reloading
        router.push(
            {
                pathname: router.pathname,
                query: {
                    ...(project?.id ? { projectId: project.id } : {}),
                    phaseId: newPhaseId
                },
            },
            undefined,
            { shallow: true }
        );
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        console.log("Page changed to:", newPage);
        setCurrentPage(newPage);
        fetchInvestments(newPage);
    };

    // Debug output
    console.log({
        loading,
        error,
        selectedPhaseId,
        investments: investments?.length,
        phases: phases?.length
    });

     useEffect(() => {
        fetchInvestments();
    }, []);

    if (loading) {
        return (
            <Layout>
                <Header />
                <PageTitle title="Founder Investments" />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-3 text-gray-600">Loading project data...</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <Header />
                <PageTitle title="Founder Investments" />
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Go Back
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Header />
            <PageTitle title="Founder Investments" />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {project?.title || 'Project'} Investments
                    </h1>
                    <p className="text-sm text-gray-500">
                        View and manage your project&apos;s investments
                    </p>
                </div>

                {/* Phase Selection */}
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
                    <label htmlFor="phaseSelect" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Phase
                    </label>
                    <select
                        id="phaseSelect"
                        value={selectedPhaseId || ''}
                        onChange={handlePhaseChange}
                        disabled={phases.length === 0}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {phases.length === 0 ? (
                            <option value="">No phases available</option>
                        ) : (
                            phases.map(phase => (
                                <option key={phase.id} value={phase.id}>
                                    Phase {phase.phaseNumber} - {formatCurrency(phase.targetAmount || phase.fundingGoal)}
                                    {phase.status ? ` (${phase.status})` : ''}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Filter and Sort */}
                <InvestmentFilterSort
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortField={sortField}
                    setSortField={setSortField}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
                    className="mb-6"
                />

                {/* Results count */}
                <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Showing {investments.length} of {totalInvestments} investments
                    </div>
                </div>

                {/* Investments Table */}
                <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                    <InvestmentTable
                        investments={investments}
                        loading={loadingInvestments}
                        formatCurrency={formatCurrency}
                    />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}

                {/* Return to project link */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push(`/edit-project`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Return to Project
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default function FounderInvestmentsPage() {
    return (
        <ProtectedRoute requiredRoles={['FOUNDER']}>
            <FounderInvestments />
        </ProtectedRoute>
    );
}