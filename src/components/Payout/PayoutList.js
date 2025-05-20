import React from 'react';
import { PayoutCard } from './PayoutCard';
import { Eye } from 'lucide-react';

export const PayoutList = ({ payouts, isLoading, error, onViewDetails }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
                <p className="font-medium">Error loading payouts</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!payouts || payouts.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 px-6 py-8 rounded-md text-center my-4">
                <p className="font-medium text-lg mb-2">No Payouts Found</p>
                <p className="text-gray-500">There are no payouts available for this project yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payouts.map(payout => (
                <div key={payout.id} className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-6 py-4">
                        <h3 className="text-white font-bold text-lg">Payout Summary</h3>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4">
                            <h4 className="font-semibold text-gray-700 text-lg">{payout.projectTitle}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                    Phase {payout.phaseNumber}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Amount</p>
                                <p className="font-medium text-gray-800">
                                    ${payout.amount.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Payout Date</p>
                                <p className="font-medium text-gray-800">
                                    {new Date(payout.payoutDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        
                        {onViewDetails && (
                            <button 
                                onClick={() => onViewDetails(payout)}
                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};