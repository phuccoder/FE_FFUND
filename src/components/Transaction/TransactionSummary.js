import React from 'react';

export default function TransactionSummary({ statistics = {} }) {
  const {
    totalTransaction = 0,
    totalAmount = 0,
    totalProfit = 0,
    totalPlatformFee = 0,
    totalStripeFee = 0,
    totalInvestor = 0
  } = statistics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-gray-700">Total Transactions</h3>
        <p className="text-2xl font-bold text-blue-600">{totalTransaction}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
        <h3 className="text-lg font-semibold text-gray-700">Total Amount</h3>
        <p className="text-2xl font-bold text-green-600">${totalAmount ? totalAmount.toFixed(2) : '0.00'}</p>
      </div>
    </div>
  );
}