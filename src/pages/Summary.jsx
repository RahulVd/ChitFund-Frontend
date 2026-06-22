import React, { useState } from 'react';
import { getMonthlySummary, getUnpaidMembers } from '../services/api';

function Summary({ selectedGroup }) {
  const [monthNumber, setMonthNumber] = useState('');
  const [summary, setSummary] = useState(null);
  const [unpaid, setUnpaid] = useState([]);
  const [message, setMessage] = useState('');
  const CHIT_GROUP_ID = selectedGroup?.id;

  if (!selectedGroup) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Please select a chit group first.</p>
    </div>
  );

  const handleFetch = () => {
    if (!monthNumber) return setMessage('Please enter a month number');
    setMessage('');

    getMonthlySummary(CHIT_GROUP_ID, monthNumber)
      .then(res => setSummary(res.data))
      .catch(err => setMessage(err.response?.data?.message || 'Error fetching summary'));

    getUnpaidMembers(CHIT_GROUP_ID, monthNumber)
      .then(res => setUnpaid(res.data))
      .catch(err => console.error(err));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Monthly Summary</h1>
        <p className="text-gray-500 mt-1">{selectedGroup.chitName}</p>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Month Number</label>
            <input
              className="border border-gray-200 rounded-lg p-2 w-48 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1"
              type="number"
              value={monthNumber}
              onChange={e => setMonthNumber(e.target.value)}
            />
          </div>
          <button
            onClick={handleFetch}
            className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Get Summary
          </button>
        </div>
        {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Month</p>
            <p className="text-3xl font-bold text-blue-600">{summary.monthNumber}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Paid</p>
            <p className="text-3xl font-bold text-green-600">{summary.paidCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Unpaid</p>
            <p className="text-3xl font-bold text-red-500">{summary.unpaidCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Expected</p>
            <p className="text-3xl font-bold text-purple-600">₹{summary.totalExpected?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">₹{summary.totalCollected?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-gray-700">{summary.totalMembers}</p>
          </div>
        </div>
      )}

      {/* Unpaid Members */}
      {unpaid.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-red-500">Unpaid Members</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-sm text-gray-500 font-medium">Name</th>
                <th className="text-left p-4 text-sm text-gray-500 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {unpaid.map(member => (
                <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-800">{member.name}</td>
                  <td className="p-4 text-sm text-gray-600">{member.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Summary;