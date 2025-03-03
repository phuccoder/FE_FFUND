import React, { useState, useEffect } from 'react';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import invitationService from 'src/services/invitationService';

const InvitationList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationService.getInvitations(currentPage, pageSize);
      setInvitations(response.data.data);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invitations');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [currentPage, pageSize]);

  const handleStatusChange = async (id, isAccepted) => {
    try {
      // Create and log the request body
      const requestBody = {
        invitationId: id,
        action: isAccepted ? 'ACCEPT' : 'DECLINE'
      };
      console.log(`Invitation ${isAccepted ? 'accept' : 'decline'} request body:`, requestBody);
      
      // Call the API
      await invitationService.respondToInvitation(id, isAccepted);
      
      // Refresh the list after updating
      fetchInvitations();
    } catch (err) {
      console.error('Error handling invitation response:', err);
      setError('Failed to update invitation');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      default:
        return 'bg-orange-100 text-orange-800'; // Changed to orange for pending
    }
  };

  if (loading) return <div className="text-center py-8">Loading invitations...</div>;
  if (error) return <div className="bg-red-100 p-4 rounded-md text-red-700">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-orange-200">
      <div className="px-4 py-5 sm:px-6 bg-orange-50">
        <h3 className="text-lg leading-6 font-medium text-orange-900">Invitations</h3>
        <p className="mt-1 max-w-2xl text-sm text-orange-600">Manage your team invitations</p>
      </div>
      
      {invitations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No invitations found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-orange-200">
            <thead className="bg-orange-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">From</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">To</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-orange-100">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-orange-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invitation.inviterName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invitation.inviteeName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invitation.status)}`}>
                      {invitation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invitation.invitedAt ? formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {invitation.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(invitation.id, true)}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1 rounded"
                          title="Accept invitation"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(invitation.id, false)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1 rounded"
                          title="Decline invitation"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    {invitation.status !== 'PENDING' && (
                      <span className="text-gray-400">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-orange-200 sm:px-6 bg-orange-50">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className={`relative inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md ${
                currentPage === 0 ? 'bg-orange-100 text-orange-400 cursor-not-allowed' : 'bg-white text-orange-700 hover:bg-orange-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md ${
                currentPage === totalPages - 1 ? 'bg-orange-100 text-orange-400 cursor-not-allowed' : 'bg-white text-orange-700 hover:bg-orange-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-orange-700">
                Showing <span className="font-medium">{invitations.length > 0 ? currentPage * pageSize + 1 : 0}</span> to{' '}
                <span className="font-medium">{Math.min((currentPage + 1) * pageSize, invitations.length)}</span> of{' '}
                <span className="font-medium">{invitations.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-orange-300 bg-white text-sm font-medium ${
                    currentPage === 0 ? 'text-orange-300 cursor-not-allowed' : 'text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft size={18} />
                </button>
                {[...Array(totalPages).keys()].map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === page
                        ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-white border-orange-300 text-orange-500 hover:bg-orange-50'
                    } text-sm font-medium`}
                  >
                    {page + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-orange-300 bg-white text-sm font-medium ${
                    currentPage === totalPages - 1 ? 'text-orange-300 cursor-not-allowed' : 'text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight size={18} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationList;