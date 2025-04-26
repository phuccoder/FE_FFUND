import React, { useState } from 'react';
import { FaSortUp, FaSortDown, FaSort, FaDownload, FaEye, FaFilter, FaStripe } from 'react-icons/fa';

export default function TransactionTable({
  transactions,
  onSort,
  onViewDashboard,
  projectPaymentInfo,
  dashboardLoading
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(field, newDirection);
    }
  };

  // Render sort indicator
  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="inline ml-1 opacity-50" />;
    return sortDirection === 'asc' ?
      <FaSortUp className="inline ml-1 text-blue-500" /> :
      <FaSortDown className="inline ml-1 text-blue-500" />;
  };

  // Function to export table data to CSV
  const exportToCSV = () => {
    const headers = [
      'Investment ID',
      'Investor',
      'Project',
      'Date',
      'Amount',
      'Profit',
      'Platform Fee',
      'Stripe Fee'
    ];

    const csvRows = transactions.map(transaction => [
      transaction.investmentId,
      transaction.investorName,
      transaction.projectTitle,
      formatDate(transaction.transactionDate),
      transaction.amount,
      transaction.profit,
      transaction.platformFee,
      transaction.stripeFee
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedProjects = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.projectId]) {
      acc[transaction.projectId] = {
        projectId: transaction.projectId,
        projectTitle: transaction.projectTitle,
        transactions: []
      };
    }
    acc[transaction.projectId].transactions.push(transaction);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden border border-gray-200">
      <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <FaFilter className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Transaction Records</h3>
            <p className="text-sm text-gray-500">
              {transactions.length} transactions found
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <FaDownload className="mr-2" /> Export CSV
          </button>

          {Object.keys(groupedProjects).length > 0 && (
            <div className="relative inline-block text-left">
              <div>
                <button type="button"
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm font-medium"
                  onClick={() => setShowDashboardMenu(!showDashboardMenu)}
                >
                  <FaStripe className="mr-2" /> Stripe Dashboards
                </button>
              </div>

              {showDashboardMenu && (
                <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {Object.values(groupedProjects).map(project => (
                      <button
                        key={project.projectId}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-between"
                        onClick={() => {
                          onViewDashboard(project.projectId);
                          setShowDashboardMenu(false);
                        }}
                        disabled={!projectPaymentInfo[project.projectId] || dashboardLoading[project.projectId]}
                      >
                        <span>{project.projectTitle}</span>
                        {dashboardLoading[project.projectId] ? (
                          <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <FaEye className="text-purple-600" />
                        )}
                      </button>
                    ))}
                    {Object.keys(groupedProjects).length === 0 && (
                      <p className="px-4 py-2 text-sm text-gray-500">No projects available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gradient-to-r from-blue-700 to-blue-500 text-white sticky top-0">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('investmentId')}>
                <div className="flex items-center">
                  Investment ID {renderSortIcon('investmentId')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('investorName')}>
                <div className="flex items-center">
                  Investor {renderSortIcon('investorName')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('projectTitle')}>
                <div className="flex items-center">
                  Project {renderSortIcon('projectTitle')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('transactionDate')}>
                <div className="flex items-center">
                  Date {renderSortIcon('transactionDate')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('amount')}>
                <div className="flex items-center">
                  Amount {renderSortIcon('amount')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('profit')}>
                <div className="flex items-center">
                  Profit {renderSortIcon('profit')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('platformFee')}>
                <div className="flex items-center">
                  Platform Fee {renderSortIcon('platformFee')}
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => handleSort('stripeFee')}>
                <div className="flex items-center">
                  Stripe Fee {renderSortIcon('stripeFee')}
                </div>
              </th>
              <th className="px-6 py-4">
                <div className="flex items-center">
                  Actions
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <tr
                  key={transaction.investmentId}
                  className={`border-b hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${hoveredRow === transaction.investmentId ? 'bg-blue-50' : ''}`}
                  onMouseEnter={() => setHoveredRow(transaction.investmentId)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-6 py-4 font-semibold text-blue-700">
                    <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">
                      #{transaction.investmentId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{transaction.investorName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded font-medium">
                      {transaction.projectTitle}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      {formatDate(transaction.transactionDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-medium bg-green-50 py-1 px-3 rounded-full">
                      {formatCurrency(transaction.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-purple-600 bg-purple-50 py-1 px-3 rounded-full">
                      {formatCurrency(transaction.platformFee)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-orange-500 bg-orange-50 py-1 px-3 rounded-full">
                      {formatCurrency(transaction.stripeFee)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewDashboard(transaction.projectId)}
                      disabled={!projectPaymentInfo[transaction.projectId] || dashboardLoading[transaction.projectId]}
                      className="p-2 text-purple-600 bg-purple-50 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={projectPaymentInfo[transaction.projectId] ? "View Stripe Dashboard" : "Stripe not connected"}
                    >
                      {dashboardLoading[transaction.projectId] ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <FaStripe className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-xl font-medium mb-2">No transactions found</p>
                    <p className="text-sm mb-4">Try adjusting your search filters</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center text-sm">
          <div className="text-gray-600">
            <span className="font-medium">{transactions.length}</span> records found
          </div>
          <div className="text-gray-600">
            Page <span className="font-medium">1</span> of <span className="font-medium">1</span>
          </div>
        </div>
      )}
    </div>
  );
}