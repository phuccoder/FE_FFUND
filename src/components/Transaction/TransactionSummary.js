import React from 'react';

export default function TransactionSummary({ totalTransactions, totalPaid }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-gray-700">Total Transactions</h3>
        <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
        <h3 className="text-lg font-semibold text-gray-700">Total Amount Paid</h3>
        <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
      </div>
    </div>
  );
}