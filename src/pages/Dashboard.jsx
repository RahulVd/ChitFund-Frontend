import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-6 shadow-sm border border-gray-100`}>
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Dashboard({ selectedGroup, paymentVersion })  {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedGroup) return;
    getDashboard(selectedGroup.id)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, [selectedGroup, paymentVersion]);

  if (!selectedGroup) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Please select a chit group first.</p>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  const collectionPercent = Math.min(
    Math.round((data.totalCollectedSoFar / data.totalChitAmount) * 100) || 0,
    100
  );

  const unpaidNames = data.unpaidMemberNamesThisMonth || [];
  const hasUnpaid = unpaidNames.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {data.chitGroupName}</p>
      </div>

      {data.currentMonth > 0 && (
        hasUnpaid ? (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">
                {unpaidNames.length} member{unpaidNames.length > 1 ? 's' : ''} haven't paid Month {data.currentMonth} yet
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                {unpaidNames.join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-emerald-700">
              Everyone has paid Month {data.currentMonth}
            </p>
          </div>
        )
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Members" value={data.totalMembers} color="text-blue-600" bg="bg-white" />
        <StatCard label="Monthly Contribution" value={`₹${data.monthlyContribution.toLocaleString()}`} color="text-green-600" bg="bg-white" />
        <StatCard label="Total Collected" value={`₹${data.totalCollectedSoFar.toLocaleString()}`} color="text-purple-600" bg="bg-white" />
        <StatCard label="Current Month" value={`Month ${data.currentMonth}`} color="text-orange-500" bg="bg-white" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Collection Progress</h3>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>₹{data.totalCollectedSoFar.toLocaleString()} collected</span>
            <span>{collectionPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            of ₹{data.totalChitAmount.toLocaleString()} total chit amount
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Auction Status</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Won</span>
              <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                {data.membersWhoWonAuction}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Yet to Win</span>
              <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full">
                {data.membersYetToWin}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="bg-blue-100 text-blue-600 text-sm font-semibold px-3 py-1 rounded-full">
                {data.totalMembers}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;