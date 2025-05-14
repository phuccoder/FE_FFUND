import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSearch } from 'react-icons/fa';
import { transactionService } from 'src/services/transactionService';
import InvestmentDetailsModal from './InvestmentDetailsModal';


const InvestmentTable = ({ investments, loading, formatCurrency }) => {
    const investmentsArray = Array.isArray(investments) ? investments : [];
    const [summary, setSummary] = useState({
        totalInvestments: 0,
        totalAmount: 0,
        totalRefund: 0
    });
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modal state
    const [selectedInvestment, setSelectedInvestment] = useState(null);
    const [investmentLoading, setInvestmentLoading] = useState(false);
    const [showInvestmentModal, setShowInvestmentModal] = useState(false);
    const [investmentError, setInvestmentError] = useState(null);
    
    // Calculate pagination values
    useEffect(() => {
        if (Array.isArray(investments)) {
            setSummary({
                totalInvestments: investments.length,
                totalAmount: investments.reduce((total, inv) => total + (inv.amount || 0), 0),
                totalRefund: investments.reduce((total, inv) => total + (inv.refundAmount || 0), 0)
            });
            
            // Update total pages calculation
            setTotalPages(Math.ceil(investments.length / itemsPerPage));
            // Reset to page 1 if we have new data
            setCurrentPage(1);
        }
    }, [investments, itemsPerPage]);
    
    // Get current items for the page
    const getCurrentItems = () => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return investmentsArray.slice(indexOfFirstItem, indexOfLastItem);
    };
    
    // Handle view investment details
    const handleViewInvestment = async (investmentId) => {
        // If the investment details are already in our data, use that
        const existingInvestment = investments.find(inv => inv.id === investmentId);
        
        if (existingInvestment) {
            setSelectedInvestment(existingInvestment);
            setShowInvestmentModal(true);
            return;
        }
        
        // Otherwise fetch from API
        setInvestmentLoading(true);
        setInvestmentError(null);
        setSelectedInvestment(null);
        setShowInvestmentModal(true);
        
        try {
            const investmentData = await transactionService.getInvestmentById(investmentId);
            setSelectedInvestment(investmentData);
        } catch (error) {
            console.error('Error fetching investment details:', error);
            setInvestmentError(error.message || 'Failed to load investment details');
        } finally {
            setInvestmentLoading(false);
        }
    };
    
    // Check URL for investmentId parameter and open modal if present
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const investmentId = urlParams.get('investmentId');
        
        if (investmentId) {
            handleViewInvestment(parseInt(investmentId));
            
            // Clear the URL parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, []);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Go to previous page
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    
    // Go to next page
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };
    
    // Handle the change of items per page
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const formatDate = (dateValue) => {
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateValue;
        }
        if (Array.isArray(dateValue) && dateValue.length === 3) {
            const [year, month, day] = dateValue;
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        return 'N/A';
    };

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading investments...</span>
            </div>
        );
    }

    if (!investments || investments.length === 0) {
        return (
            <div className="text-center py-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">No investments found.</p>
            </div>
        );
    }

    const currentItems = getCurrentItems();
    
    return (
        <>
            <div className="overflow-x-auto">
                {/* Items per page control */}
                <div className="flex justify-end mb-2">
                    <div className="inline-flex items-center text-xs text-gray-600">
                        <span className="mr-2">Show:</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={handleItemsPerPageChange}
                            className="border border-gray-300 rounded-md text-xs p-1"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="ml-2">per page</span>
                    </div>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((investment) => (
                            <tr key={investment.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-blue-600 font-medium">
                                    <button
                                        className="hover:underline"
                                        onClick={() => handleViewInvestment(investment.id)}
                                    >
                                        #{investment.id}
                                    </button>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{investment.investorName}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{formatCurrency(investment.amount)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{investment.investmentDate}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${investment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        investment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {investment.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {investment.milestoneName || 'No milestone'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {investment.refundAmount ? (
                                        <span className="text-green-600 font-medium">{formatCurrency(investment.refundAmount)}</span>
                                    ) : (
                                        <span className="text-gray-400">N/A</span>
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <button
                                        onClick={() => handleViewInvestment(investment.id)}
                                        className="p-1 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"
                                        title="View investment details"
                                    >
                                        <FaSearch className="h-3 w-3" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Pagination controls */}
                <div className="mt-3 flex items-center justify-between">
                    {/* Summary section */}
                    <div className="p-3 bg-gray-50 rounded-md">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Total Investments:</span>
                                <span className="ml-1">{summary.totalInvestments}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Total Amount:</span>
                                <span className="ml-1">{formatCurrency(summary.totalAmount)}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Total Refund:</span>
                                <span className="ml-1 text-green-600">{formatCurrency(summary.totalRefund)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Page navigation */}
                    <div className="flex items-center">
                        <span className="text-xs text-gray-700 mr-2">
                            Page {currentPage} of {totalPages} 
                            {summary.totalInvestments > 0 && ` (${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, summary.totalInvestments)} of ${summary.totalInvestments})`}
                        </span>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-l-md px-2 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            {/* Page numbers - only show a limited range to avoid clutter */}
                            {[...Array(totalPages).keys()].map(num => {
                                // Show first page, last page, and pages around current page
                                const pageNum = num + 1;
                                if (
                                    pageNum === 1 || 
                                    pageNum === totalPages || 
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => paginate(pageNum)}
                                            className={`relative inline-flex items-center px-3 py-1 text-xs font-semibold ${currentPage === pageNum ? 'bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                // Show ellipsis for skipped pages (but only once per range)
                                else if (
                                    (pageNum === 2 && currentPage > 3) ||
                                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                ) {
                                    return (
                                        <span
                                            key={pageNum}
                                            className="relative inline-flex items-center px-3 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-300"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                            
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center rounded-r-md px-2 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            <InvestmentDetailsModal
                isOpen={showInvestmentModal}
                onClose={() => setShowInvestmentModal(false)}
                investment={selectedInvestment}
                loading={investmentLoading}
                error={investmentError}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
            />
        </>
    );
};

InvestmentTable.propTypes = {
    investments: PropTypes.array,
    loading: PropTypes.bool,
    formatCurrency: PropTypes.func.isRequired
};

InvestmentTable.defaultProps = {
    investments: [],
    loading: false
};

export default InvestmentTable;