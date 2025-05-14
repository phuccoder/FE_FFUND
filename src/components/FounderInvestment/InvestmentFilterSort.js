import React from 'react';
import PropTypes from 'prop-types';

const InvestmentFilterSort = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  className
}) => {
  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchQuery(value ? `investment:user.fullName:eq:${value}` : '');
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const handleSortDirectionChange = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const displaySearchValue = searchQuery.startsWith('investment:user.fullName:eq:') 
    ? searchQuery.replace('investment:user.fullName:eq:', '') 
    : searchQuery;

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
      <div className="mb-3">
        <h3 className="text-md font-medium text-gray-700 mb-2">Filter & Sort Investments</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Search with updated value display */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="investorSearch" className="block text-sm font-medium text-gray-700 mb-1">
            Search Investor
          </label>
          <input
            type="text"
            id="investorSearch"
            placeholder="Search by investor name..."
            value={displaySearchValue}
            onChange={handleSearchChange}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sortField" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              id="sortField"
              value={sortField}
              onChange={handleSortChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="investmentDate">Date</option>
              <option value="amount">Amount</option>
            </select>
            
            <button
              type="button"
              onClick={handleSortDirectionChange}
              className={`flex items-center justify-center px-3 border ${
                sortDirection === 'asc' 
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                  : 'border-blue-600 text-white bg-blue-600 hover:bg-blue-700'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

InvestmentFilterSort.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  sortField: PropTypes.string.isRequired,
  setSortField: PropTypes.func.isRequired,
  sortDirection: PropTypes.string.isRequired,
  setSortDirection: PropTypes.func.isRequired,
  className: PropTypes.string
};

InvestmentFilterSort.defaultProps = {
  className: ''
};

export default InvestmentFilterSort;