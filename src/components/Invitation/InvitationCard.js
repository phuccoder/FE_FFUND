import React from 'react';
import { Check, X} from 'lucide-react';

const InvitationCard = ({ invitation, onAccept, onDecline }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'ACCEPTED': return 'text-green-600';
        case 'DECLINED': return 'text-red-600';
        default: return 'text-orange-600'; 
      }
    };
  
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-orange-200 border border-orange-200">
        <div className="px-4 py-5 sm:px-6 bg-orange-50">
          <h3 className="text-lg leading-6 font-medium text-orange-900">Invitation from {invitation.inviterName}</h3>
          <p className={`mt-1 max-w-2xl text-sm ${getStatusColor(invitation.status)}`}>
            Status: {invitation.status}
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <p className="text-sm text-gray-500">To: {invitation.inviteeName}</p>
          <p className="text-sm text-gray-500 mt-2">
            {invitation.invitedAt ? 
              `Invited on: ${new Date(invitation.invitedAt).toLocaleDateString()}` : 
              'Date not available'}
          </p>
        </div>
        {invitation.status === 'PENDING' && (
          <div className="px-4 py-4 sm:px-6 flex justify-end space-x-3 bg-orange-50">
            <button
              onClick={() => onAccept(invitation.id)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Check size={16} className="mr-1" /> Accept
            </button>
            <button
              onClick={() => onDecline(invitation.id)}
              className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm leading-4 font-medium rounded-md shadow-sm text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <X size={16} className="mr-1" /> Decline
            </button>
          </div>
        )}
      </div>
    );
  };
  export default InvitationCard;