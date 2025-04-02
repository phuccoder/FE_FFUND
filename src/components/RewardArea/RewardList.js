import React from 'react';

export default function RewardList({ investments, selectedInvestmentId, onSelectInvestment }) {
  // Filter to show only investments with milestones at the top
  const sortedInvestments = [...investments].sort((a, b) => {
    // First condition: Has milestone or not
    if (a.milestone && !b.milestone) return -1;
    if (!a.milestone && b.milestone) return 1;
    // Second condition: Sort by date (newest first)
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div className="space-y-2">
      {sortedInvestments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No investments found</p>
      ) : (
        sortedInvestments.map((investment) => (
          <div 
            key={investment.id}
            onClick={() => onSelectInvestment(investment)}
            className={`p-3 rounded-md cursor-pointer transition-colors ${
              investment.id === selectedInvestmentId
                ? 'bg-blue-100 border-blue-300 border'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            } ${investment.milestone ? 'relative' : ''}`}
          >
            {investment.milestone && (
              <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                Reward
              </span>
            )}
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{investment.projectTitle}</h3>
                <p className="text-sm text-gray-600">Phase: {investment.phaseNumber}</p>
                <p className="text-sm text-gray-600">Amount: ${investment.amount}</p>
              </div>
              <div className={`text-sm px-2 py-1 rounded-full ${
                investment.status === 'PAID' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {investment.status}
              </div>
            </div>
            
            {investment.milestone && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Milestone: {investment.milestone.milestoneName}
                </p>
                <p className="text-xs text-gray-500">
                  {investment.milestone.items?.length || 0} items available
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}