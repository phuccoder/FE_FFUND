import { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';
import { transactionService } from 'src/services/transactionService';
import TransactionFilter from '@/components/FounderTransaction/TransactionFilter';
import TransactionSummary from '@/components/FounderTransaction/TransactionSummary';
import TransactionTable from '@/components/FounderTransaction/TransactionTable';
import Pagination from '@/components/Pagination';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout/Layout';

function FounderTransaction() {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 0,
        totalPages: 0,
        pageSize: 10,
        totalElements: 0
    });
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        investorName: '',
        projectTitle: '',
        projectId: null
    });
    const [sort, setSort] = useState('');
    const [statistics, setStatistics] = useState({
        totalAmount: 0,
        totalStripeFee: 0,
        totalPlatformFee: 0,
        totalProfit: 0,
        totalInvestor: 0,
        totalTransaction: 0
    });

    const [projectsMapping, setProjectsMapping] = useState({});
    const [projectPaymentInfo, setProjectPaymentInfo] = useState({});
    const [dashboardLoading, setDashboardLoading] = useState({});

    // Fetch paginated transactions and update pagination info
    useEffect(() => {
        fetchTransactions();
    }, [pagination.currentPage, filters, sort]);

    // Fetch transaction statistics when filters change
    useEffect(() => {
        fetchTransactionStatistics(filters.projectId);
    }, [filters.projectId]);

    // Initial load of statistics with no project filter
    useEffect(() => {
        fetchTransactionStatistics(null);
    }, []);

    useEffect(() => {
        const fetchProjectPaymentInfo = async () => {
            const uniqueProjectIds = [...new Set(transactions.map(t => t.projectId))];
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

        if (transactions.length > 0) {
            fetchProjectPaymentInfo();
        }
    }, [transactions]);

    const fetchTransactionStatistics = async (projectId) => {
        try {
            setSummaryLoading(true);
            const statistics = await transactionService.getTransactionStatistics(projectId);
            setStatistics(statistics);
        } catch (err) {
            console.error('Error fetching transaction statistics:', err);
            // Set default values if the API call fails
            setStatistics({
                totalAmount: 0,
                totalStripeFee: 0,
                totalPlatformFee: 0,
                totalProfit: 0,
                totalInvestor: 0,
                totalTransaction: 0
            });
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const result = await transactionService.getTransactionsByFounder(
                pagination.currentPage,
                pagination.pageSize,
                sort,
                filters
            );

            const transactionsData = result.content || [];
            setTransactions(transactionsData);
            setPagination({
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                pageSize: result.pageSize,
                totalElements: result.totalElements
            });

            // Update project mapping
            const newProjectsMapping = {};
            transactionsData.forEach(transaction => {
                if (transaction.projectTitle && transaction.projectId) {
                    newProjectsMapping[transaction.projectTitle] = transaction.projectId;
                }
            });
            setProjectsMapping(prevMapping => ({
                ...prevMapping,
                ...newProjectsMapping
            }));

        } catch (err) {
            setError('Error fetching transaction data: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
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

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleFilterChange = (newFilters) => {
        // Get the project ID based on the selected project title
        const projectId = newFilters.projectTitle ? projectsMapping[newFilters.projectTitle] : null;

        setFilters({
            ...newFilters,
            projectId
        });
        setPagination(prev => ({ ...prev, currentPage: 0 })); // Reset to first page on filter change
    };

    const handleSortChange = (field, direction) => {
        // Format: +fieldName for ascending, -fieldName for descending
        const sortValue = direction === 'asc' ? `+${field}` : `-${field}`;
        setSort(sortValue);
    };

    return (
        <Layout>
            <Header />
            <PageTitle title="Founder Transactions" />
            <TransactionFilter
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            {summaryLoading ? (
                <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500">
                        <span className="sr-only">Loading statistics...</span>
                    </div>
                </div>
            ) : (
                <TransactionSummary statistics={statistics} />
            )}

            {loading ? (
                <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4" role="alert">
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    <TransactionTable
                        transactions={transactions}
                        onSort={handleSortChange}
                        onViewDashboard={handleViewDashboard}
                        projectPaymentInfo={projectPaymentInfo}
                        dashboardLoading={dashboardLoading}
                    />

                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </Layout>
    );
}

export default function FounderTransactionPage() {
    return (
        <ProtectedRoute requiredRoles={['FOUNDER']}>
            <FounderTransaction />
        </ProtectedRoute>
    )
}