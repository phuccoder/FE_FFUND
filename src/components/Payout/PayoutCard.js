import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, BarChart } from 'lucide-react';

export const PayoutCard = ({ payout, showHeader = true }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {showHeader && (
        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-6 py-4">
          <h3 className="text-white font-bold text-lg">Payout Details</h3>
        </div>
      )}
      
      <div className="p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 text-lg">{payout.projectTitle}</h4>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              Phase {payout.phaseNumber}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium text-gray-800">{formatCurrency(payout.amount)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <BarChart className="h-5 w-5 text-purple-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Stripe Fee</p>
              <p className="font-medium text-gray-800">{formatCurrency(payout.stripe_fee)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className="font-bold text-green-600">{formatCurrency(payout.profit)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Payout Date</p>
              <p className="font-medium text-gray-800">{formatDate(payout.payoutDate)}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Project ID</p>
              <p className="font-medium text-gray-700">{payout.projectId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payout ID</p>
              <p className="font-medium text-gray-700">#{payout.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};