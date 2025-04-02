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
        projectTitle: ''
    });
    const [sort, setSort] = useState('');
    const [summaryData, setSummaryData] = useState({
        totalProfit: 0,
        totalAmount: 0,
        totalPlatformFee: 0,
        totalStripeFee: 0
    });

    // Fetch paginated transactions and update pagination info
    useEffect(() => {
        fetchTransactions();
    }, [pagination.currentPage, filters, sort]);

    // Calculate summary data whenever pagination info changes or filters change
    useEffect(() => {
        if (pagination.totalPages > 0) {
            fetchAllTransactionsForSummary();
        }
    }, [pagination.totalPages, filters]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const result = await transactionService.getTransactionsByFounder(
                pagination.currentPage,
                pagination.pageSize,
                sort,
                filters
            );

            setTransactions(result.content);
            setPagination({
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                pageSize: result.pageSize,
                totalElements: result.totalElements
            });
        } catch (err) {
            setError('Error fetching transaction data: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTransactionsForSummary = async () => {
        try {
            setSummaryLoading(true);
            
            if (pagination.totalPages <= 1) {
                const summary = calculateSummaryFromTransactions(transactions);
                setSummaryData(summary);
                setSummaryLoading(false);
                return;
            }
            
            const pagePromises = [];
            const maxPages = pagination.totalPages;

            const MAX_PAGES_TO_FETCH = 5;
            const pagesToFetch = Math.min(maxPages, MAX_PAGES_TO_FETCH);
            
            for (let i = 0; i < pagesToFetch; i++) {
                pagePromises.push(
                    transactionService.getTransactionsByFounder(
                        i, 
                        pagination.pageSize,
                        sort,
                        filters
                    )
                );
            }
            
            // Wait for all pages to load
            const pagesData = await Promise.all(pagePromises);
            
            // Combine all transactions from all pages
            let allTransactions = [];
            pagesData.forEach(pageData => {
                if (pageData.content && pageData.content.length > 0) {
                    allTransactions = [...allTransactions, ...pageData.content];
                }
            });
            
            // Check if we need to estimate for the remaining pages
            let summary = calculateSummaryFromTransactions(allTransactions);
            
            // If we couldn't fetch all pages, estimate the remainder
            if (pagesToFetch < maxPages) {
                const fetchedTransactionsCount = allTransactions.length;
                const totalTransactionsEstimate = pagination.totalElements;
                const remainingPortion = (totalTransactionsEstimate - fetchedTransactionsCount) / fetchedTransactionsCount;
                
                // Scale up the summary by the remaining portion
                summary = {
                    totalProfit: summary.totalProfit * (1 + remainingPortion),
                    totalAmount: summary.totalAmount * (1 + remainingPortion),
                    totalPlatformFee: summary.totalPlatformFee * (1 + remainingPortion),
                    totalStripeFee: summary.totalStripeFee * (1 + remainingPortion)
                };
            }
            
            setSummaryData(summary);
        } catch (err) {
            console.error('Error calculating summary data:', err);
            // Fall back to current page data if calculation fails
            const pageSummary = calculateSummaryFromTransactions(transactions);
            setSummaryData(pageSummary);
        } finally {
            setSummaryLoading(false);
        }
    };

    // Helper function to calculate summary from an array of transactions
    const calculateSummaryFromTransactions = (transactionsArray) => {
        if (!transactionsArray || transactionsArray.length === 0) {
            return { totalProfit: 0, totalAmount: 0, totalPlatformFee: 0, totalStripeFee: 0 };
        }
        
        return transactionsArray.reduce((acc, transaction) => {
            return {
                totalProfit: acc.totalProfit + transaction.profit,
                totalAmount: acc.totalAmount + transaction.amount,
                totalPlatformFee: acc.totalPlatformFee + transaction.platformFee,
                totalStripeFee: acc.totalStripeFee + transaction.stripeFee
            };
        }, { totalProfit: 0, totalAmount: 0, totalPlatformFee: 0, totalStripeFee: 0 });
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
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

            <TransactionSummary 
                summaryData={summaryData} 
            />

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