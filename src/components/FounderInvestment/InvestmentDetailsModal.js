import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

const InvestmentDetailsModal = ({ 
  isOpen, 
  onClose, 
  investment, 
  loading, 
  error,
  formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  formatDate = (dateValue) => {
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }
    if (Array.isArray(dateValue) && dateValue.length === 3) {
      const [year, month, day] = dateValue;
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return 'N/A';
  }
}) => {
  const router = useRouter();

  // Function to navigate to founder-investments page with investment ID
  const navigateToInvestmentDetails = (investmentId) => {
    router.push({
      pathname: '/founder-investments',
      query: { investmentId }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="investment-details-modal" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                  Investment Details
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : investment ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-500">Investment ID</p>
                        <p className="font-semibold">{investment.id}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-500">Investor</p>
                        <p className="font-semibold">{investment.investorName || investment.user?.fullName || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-500">Project</p>
                        <p className="font-semibold">{investment.projectTitle || investment.project?.title || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-semibold text-green-600">{formatCurrency(investment.amount)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-semibold">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            investment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            investment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {investment.status || 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-semibold">{investment.investmentDate || formatDate(investment.createdAt) || 'N/A'}</p>
                      </div>
                      {investment.milestone && (
                        <div className="bg-gray-50 p-3 rounded-md md:col-span-2">
                          <p className="text-sm text-gray-500">Milestone</p>
                          <p className="font-semibold">{investment.milestone.name || investment.milestone.title || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-1">{investment.milestone.description || 'No milestone description'}</p>
                        </div>
                      )}
                      {investment.refundAmount > 0 && (
                        <div className="bg-green-50 p-3 rounded-md md:col-span-2">
                          <p className="text-sm text-gray-500">Refund Amount</p>
                          <p className="font-semibold text-green-600">{formatCurrency(investment.refundAmount)}</p>
                          <p className="text-xs text-gray-500 mt-1">Refunded on {investment.refundDate || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  
                    {investment.comment && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-500 mb-1">Investor Comment</p>
                        <p className="text-sm">{investment.comment}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No investment data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

InvestmentDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  investment: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  formatCurrency: PropTypes.func,
  formatDate: PropTypes.func
};

export default InvestmentDetailsModal;