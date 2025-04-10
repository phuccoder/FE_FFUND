import React from 'react';

export default function TransactionSummary({ statistics }) {
  const {
    totalAmount = 0,
    totalProfit = 0,
    totalPlatformFee = 0,
    totalStripeFee = 0,
    totalTransaction = 0,
    totalInvestor = 0
  } = statistics;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h3 className="text-gray-500 text-sm font-medium">Total Amount</h3>
        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
        <h3 className="text-gray-500 text-sm font-medium">Total Profit</h3>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
        <h3 className="text-gray-500 text-sm font-medium">Platform Fees</h3>
        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalPlatformFee)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
        <h3 className="text-gray-500 text-sm font-medium">Stripe Fees</h3>
        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalStripeFee)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
        <h3 className="text-gray-500 text-sm font-medium">Transactions</h3>
        <p className="text-2xl font-bold text-gray-800">{totalTransaction}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-pink-500">
        <h3 className="text-gray-500 text-sm font-medium">Investors</h3>
        <p className="text-2xl font-bold text-gray-800">{totalInvestor}</p>
      </div>
    </div>
  );
}