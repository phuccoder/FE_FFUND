import React from 'react';

/**
 * Component that displays a project's status with appropriate styling
 * @param {Object} props Component props
 * @param {string} props.status Current project status
 * @returns {JSX.Element} Badge component
 */
export default function ProjectStatusBadge({ status }) {
  const statusMap = {
    'DRAFT': { label: 'Draft', color: 'bg-gray-200 text-gray-800' },
    'PENDING_APPROVAL': { label: 'Pending Approval', color: 'bg-yellow-200 text-yellow-800' },
    'APPROVED': { label: 'Approved', color: 'bg-green-200 text-green-800' },
    'REJECTED': { label: 'Rejected', color: 'bg-red-200 text-red-800' },
    'FUNDRAISING': { label: 'Fundraising', color: 'bg-blue-200 text-blue-800' },
    'FUNDRAISING_COMPLETED': { label: 'Fundraising Completed', color: 'bg-purple-200 text-purple-800' },
    'CANCELLED': { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    'SUSPENDED': { label: 'Suspended', color: 'bg-orange-200 text-orange-800' },
  };
  
  const statusDisplay = statusMap[status] || { label: status, color: 'bg-gray-200 text-gray-800' };
  
  return (
    <div className={`px-4 py-2 rounded-full ${statusDisplay.color}`}>
      {statusDisplay.label}
    </div>
  );
}