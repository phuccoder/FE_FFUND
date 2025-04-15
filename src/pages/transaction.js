import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import TransactionTable from '@/components/Transaction/TransactionTable';
import TransactionFilter from '@/components/Transaction/TransactionFilter';
import TransactionSummary from '@/components/Transaction/TransactionSummary';
import Pagination from '@/components/Pagination';
import Loading from '@/components/Loading';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from 'src/services/transactionService';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';

function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [projectsList, setProjectsList] = useState([]);
    const [projectIdMapping, setProjectIdMapping] = useState({});
    const [filters, setFilters] = useState({ status: '', project: '', projectId: null });
    const [sortBy, setSortBy] = useState('+id'); // Default sort by ID ascending
    const [statistics, setStatistics] = useState({});
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const pageSize = 10;

    // Load transaction statistics
    const loadTransactionStatistics = async (projectId = null) => {
        try {
            setIsLoadingStats(true);
            const statsData = await transactionService.getTransactionStatistics(projectId);
            setStatistics(statsData);
        } catch (err) {
            console.error('Failed to load transaction statistics:', err);
            // Don't set error state here to avoid blocking the whole page
        } finally {
            setIsLoadingStats(false);
        }
    };

    // Load transactions from the API
    const loadTransactions = async (page, sort) => {
        try {
            setIsLoading(true);
            const response = await transactionService.getTransactionsByInvestor(page, pageSize, sort);

            if (response) {
                const transactionsData = response.content || [];
                setTransactions(transactionsData);
                setFilteredTransactions(transactionsData);
                setTotalPages(response.totalPages || 1);

                // Create project title to ID mapping and extract unique project names
                const projectsMap = {};
                const projects = [];

                transactionsData.forEach(t => {
                    if (t.projectTitle && !projectsMap[t.projectTitle]) {
                        projectsMap[t.projectTitle] = t.projectId;
                        projects.push(t.projectTitle);
                    }
                });

                setProjectsList(projects);
                setProjectIdMapping(projectsMap);
            }
        } catch (err) {
            console.error('Failed to load transactions:', err);
            setError('Failed to load transactions. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        loadTransactions(currentPage, sortBy);
        loadTransactionStatistics(null); // Load statistics for all projects initially
    }, [currentPage, sortBy]);

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Apply filters
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);

        let filtered = transactions;

        if (newFilters.status) {
            filtered = filtered.filter(t => t.status === newFilters.status);
        }

        if (newFilters.project) {
            filtered = filtered.filter(t => t.projectTitle === newFilters.project);
        }

        setFilteredTransactions(filtered);

        // Update statistics based on selected project
        loadTransactionStatistics(newFilters.projectId);
    };

    // Handle sort change
    const handleSortChange = (field) => {
        // Only allow sorting for id and amount fields
        if (field !== 'id' && field !== 'amount') {
            return;
        }

        // If already sorting by this field, toggle direction
        if (sortBy === `+${field}`) {
            setSortBy(`-${field}`);
        } else {
            // Default to ascending sort when selecting a new field
            setSortBy(`+${field}`);
        }
    };

    // Get sort direction indicator
    const getSortIndicator = (field) => {
        if (sortBy === `+${field}`) return '↑';
        if (sortBy === `-${field}`) return '↓';
        return '';
    };

    return (
        <Layout>
            <Header />
            <PageTitle title="Transaction" />
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">My Transactions</h1>

                <TransactionFilter
                    onFilterChange={handleFilterChange}
                    projects={projectsList}
                    projectMapping={projectIdMapping}
                />

                <div className="mb-6">
                    {isLoadingStats ? (
                        <div className="text-center py-4">Loading statistics...</div>
                    ) : (
                        <TransactionSummary statistics={statistics} />
                    )}
                </div>

                {/* Sorting Controls */}
                <div className="mb-4 flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 my-auto">Sort by:</span>

                    <button
                        onClick={() => handleSortChange('id')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md ${sortBy.includes('id') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            } hover:bg-blue-50`}
                    >
                        ID {getSortIndicator('id')}
                    </button>

                    <button
                        onClick={() => handleSortChange('amount')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md ${sortBy.includes('amount') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            } hover:bg-blue-50`}
                    >
                        Amount {getSortIndicator('amount')}
                    </button>
                </div>

                {isLoading ? (
                    <Loading message="Loading transactions..." />
                ) : error ? (
                    <div className="bg-red-50 p-4 rounded-md mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <TransactionTable transactions={filteredTransactions} />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </Layout>
    );
}

export default function Transactions() {
    return (
        <ProtectedRoute requiredRoles={['INVESTOR']}>
            <TransactionsPage />
        </ProtectedRoute>
    );
}