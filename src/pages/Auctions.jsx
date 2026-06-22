import React, { useEffect, useState } from 'react';
import { getMembers, recordAuction, getAuctions, getOwnerBalance, triggerOwnerMonth, getOwnerMonths, settleGroup, getSettlements } from '../services/api';
function Auctions({ selectedGroup }) {
  const [members, setMembers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [ownerMonths, setOwnerMonths] = useState([]);
  const [ownerBalance, setOwnerBalance] = useState(0);
  const [winnerId, setWinnerId] = useState('');
  const [monthNumber, setMonthNumber] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [ownerMonthNumber, setOwnerMonthNumber] = useState('');
  const [message, setMessage] = useState('');
  const [ownerMessage, setOwnerMessage] = useState('');
  const [activeTab, setActiveTab] = useState('auction');
  const [settlements, setSettlements] = useState(null);
const [settleMessage, setSettleMessage] = useState('');
const [settling, setSettling] = useState(false);
const [isDoubleChit, setIsDoubleChit] = useState(false);
  const CHIT_GROUP_ID = selectedGroup?.id;

  const fetchData = () => {
  if (!CHIT_GROUP_ID) return;
  getMembers(CHIT_GROUP_ID).then(res => setMembers(res.data));
  getAuctions(CHIT_GROUP_ID).then(res => setAuctions(res.data));
  getOwnerBalance(CHIT_GROUP_ID).then(res => setOwnerBalance(res.data));
  getOwnerMonths(CHIT_GROUP_ID).then(res => setOwnerMonths(res.data));
  getSettlements(CHIT_GROUP_ID).then(res => setSettlements(res.data.length > 0 ? res.data : null));
};

  useEffect(() => {
    fetchData();
  }, [CHIT_GROUP_ID]);

  if (!selectedGroup) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Please select a chit group first.</p>
    </div>
  );

  const handleRecord = () => {
  if (!winnerId || !monthNumber || !bidAmount) {
    return setMessage('All fields are required');
  }
  recordAuction({
    chitGroupId: CHIT_GROUP_ID,
    winnerId: parseInt(winnerId),
    monthNumber: parseInt(monthNumber),
    bidAmount: parseFloat(bidAmount),
    isDoubleChit: isDoubleChit
  })
    .then(() => {
      setMessage('Auction recorded successfully!');
      setWinnerId(''); setMonthNumber(''); setBidAmount(''); setIsDoubleChit(false);
      fetchData();
    })
    .catch(err => setMessage(err.response?.data?.message || 'Error recording auction'));
};


  const handleSettle = () => {
  setSettling(true);
  settleGroup(CHIT_GROUP_ID)
    .then(res => {
      setSettlements(res.data);
      setSettleMessage('Group settled successfully!');
    })
    .catch(err => setSettleMessage(err.response?.data?.message || 'Error settling group'))
    .finally(() => setSettling(false));
};

  const handleOwnerMonth = () => {
    if (!ownerMonthNumber) return setOwnerMessage('Please enter a month number');
    triggerOwnerMonth({
      chitGroupId: CHIT_GROUP_ID,
      monthNumber: parseInt(ownerMonthNumber)
    })
      .then(() => {
        setOwnerMessage('Owner month triggered successfully!');
        setOwnerMonthNumber('');
        fetchData();
      })
      .catch(err => setOwnerMessage(err.response?.data?.message || 'Error triggering owner month'));
  };

  // Group auctions by month to detect double chits
  const auctionsByMonth = auctions.reduce((acc, auction) => {
    const key = auction.monthNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(auction);
    return acc;
  }, {});

  // Build combined timeline
  const allMonths = new Set([
    ...auctions.map(a => a.monthNumber),
    ...ownerMonths.map(o => o.monthNumber)
  ]);
  const sortedMonths = [...allMonths].sort((a, b) => a - b);

  const existingWinnerForTypedMonth = monthNumber
    ? (auctionsByMonth[parseInt(monthNumber)] || []).length === 1
    : false;

  return (
    
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Auctions</h1>
        <p className="text-gray-500 mt-1">{selectedGroup.chitName}</p>
      </div>

      {/* Owner Balance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-sm text-gray-500 mb-1">Owner Balance</p>
        <p className="text-3xl font-bold text-purple-600">₹{ownerBalance?.toLocaleString()}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('auction')}
          className={`px-5 py-2 rounded-lg text-sm font-medium ${activeTab === 'auction' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          🏆 Record Auction
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          className={`px-5 py-2 rounded-lg text-sm font-medium ${activeTab === 'owner' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          👑 Owner Month
        </button>
        {selectedGroup.status === 'COMPLETED' && (
    <button
      onClick={() => setActiveTab('settle')}
      className={`px-5 py-2 rounded-lg text-sm font-medium ${activeTab === 'settle' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
    >
      🏁 Settle Group
    </button>
  )}
      </div>

      {/* Auction Form */}
      {activeTab === 'auction' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Record Auction Winner</h3>
          <div className="grid grid-cols-4 gap-4">
  <div>
    <label className="text-sm text-gray-500 mb-1 block">Winner</label>
    <select
      className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={winnerId}
      onChange={e => setWinnerId(e.target.value)}
    >
      <option value="">Select Winner</option>
      {members.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  </div>
  <div>
    <label className="text-sm text-gray-500 mb-1 block">Month Number</label>
    <input
      className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="e.g. 1"
      type="number"
      value={monthNumber}
      onChange={e => setMonthNumber(e.target.value)}
    />
  </div>
  <div>
    <label className="text-sm text-gray-500 mb-1 block">Bid Amount (₹)</label>
    <input
      className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="e.g. 20000"
      type="number"
      value={bidAmount}
      onChange={e => setBidAmount(e.target.value)}
    />
  </div>
  <div className="flex flex-col justify-end pb-2">
    <label className={`flex items-center gap-2 text-sm ${existingWinnerForTypedMonth ? 'text-gray-700' : 'text-gray-300'}`}>
      <input
        type="checkbox"
        checked={isDoubleChit}
        disabled={!existingWinnerForTypedMonth}
        onChange={e => setIsDoubleChit(e.target.checked)}
        className="w-4 h-4 rounded accent-green-600"
      />
      ⚡ Double Chit
    </label>
    {!existingWinnerForTypedMonth && monthNumber && (
      <span className="text-xs text-gray-400 mt-1">No first winner yet for month {monthNumber}</span>
    )}
  </div>
</div>
          {message && (
            <p className={`mt-3 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
          <button onClick={handleRecord}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Record Auction
          </button>
        </div>
      )}

      {/* Owner Month Form */}
      {activeTab === 'owner' && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 border-2 p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">👑 Trigger Owner Month</h3>
          <p className="text-sm text-gray-400 mb-4">
            No bidding this month — ₹{selectedGroup.totalChitAmount?.toLocaleString()} will be added to owner balance automatically.
          </p>
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Month Number</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-48 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. 2"
                type="number"
                value={ownerMonthNumber}
                onChange={e => setOwnerMonthNumber(e.target.value)}
              />
            </div>
            <button onClick={handleOwnerMonth}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
              Trigger Owner Month
            </button>
          </div>
          {ownerMessage && (
            <p className={`mt-3 text-sm ${ownerMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {ownerMessage}
            </p>
          )}
        </div>
      )}

      {/* Settle Group Form */}
{activeTab === 'settle' && (
  <div className="bg-white rounded-xl shadow-sm border border-green-100 border-2 p-6 mb-6">
    <h3 className="font-semibold text-gray-700 mb-2">🏁 Settle Group</h3>
    <p className="text-sm text-gray-400 mb-4">
      Distribute the remaining owner balance equally among all {selectedGroup.totalMembers} members.
    </p>

    {!settlements ? (
      <>
        <div className="bg-green-50 rounded-lg p-4 mb-4 inline-block">
          <p className="text-xs text-gray-500">Each member will receive</p>
          <p className="text-xl font-bold text-green-700">
            ₹{(ownerBalance / selectedGroup.totalMembers).toFixed(2)}
          </p>
        </div>
        <div>
          <button onClick={handleSettle} disabled={settling}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {settling ? 'Settling...' : 'Settle & Distribute'}
          </button>
        </div>
      </>
    ) : (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Member</th>
            <th className="py-2">Dividend</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map(s => (
            <tr key={s.id} className="border-b last:border-0">
              <td className="py-2">{s.member.name}</td>
              <td className="py-2 text-green-700 font-medium">₹{s.dividendAmount?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    {settleMessage && (
      <p className={`mt-3 text-sm ${settleMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
        {settleMessage}
      </p>
    )}
  </div>
)}

      {/* Timeline Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Auction History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-4 text-sm text-gray-500 font-medium">Month</th>
              <th className="text-left p-4 text-sm text-gray-500 font-medium">Type</th>
              <th className="text-left p-4 text-sm text-gray-500 font-medium">Winner</th>
              <th className="text-left p-4 text-sm text-gray-500 font-medium">Bid Amount</th>
              <th className="text-left p-4 text-sm text-gray-500 font-medium">Received</th>
              <th className="text-left p-4 text-sm text-gray-500 font-medium">Owner Balance After</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonths.map(month => {
              const monthAuctions = auctionsByMonth[month] || [];
              const isOwnerMonth = ownerMonths.find(o => o.monthNumber === month);
              const isDoubleChit = monthAuctions.length === 2;

              return (
                <React.Fragment key={month}>
                  {/* Owner Month Row */}
                  {isOwnerMonth && (
                    <tr className="bg-purple-50 border-b border-purple-100">
                      <td className="p-4 text-sm font-semibold text-purple-700">Month {month}</td>
                      <td className="p-4">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          👑 Owner Month
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">—</td>
                      <td className="p-4 text-sm text-gray-400">—</td>
                      <td className="p-4 text-sm text-gray-400">—</td>
                      <td className="p-4 text-sm font-medium text-purple-600">
                        +₹{isOwnerMonth.amountAdded?.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Double Chit Header */}
                  {isDoubleChit && (
                    <tr className="bg-green-50 border-b border-green-100">
                      <td colSpan={6} className="px-4 py-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          ⚡ Double Chit Month — Month {month}
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* Auction Rows */}
                  {monthAuctions.map((auction, index) => (
                    <tr key={auction.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isDoubleChit ? 'bg-green-50/30' : ''}`}>
                      <td className="p-4 text-sm text-gray-700">
                        {!isDoubleChit ? `Month ${auction.monthNumber}` : index === 0 ? '└ First' : '└ Second'}
                      </td>
                      <td className="p-4">
                        {isDoubleChit ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            ⚡ Double Chit
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-4">
  <div className="flex items-center gap-2">
    <div className="bg-yellow-100 text-yellow-600 font-semibold text-sm w-8 h-8 rounded-full flex items-center justify-center">
      {auction.winner.name.charAt(0)}
    </div>
    <span className="text-sm font-medium text-gray-800">{auction.winner.name}</span>
  </div>
</td>
                      <td className="p-4 text-sm text-gray-700">₹{auction.bidAmount?.toLocaleString()}</td>
                      <td className="p-4 text-sm font-semibold text-green-600">₹{auction.receivedAmount?.toLocaleString()}</td>
                      <td className="p-4 text-sm font-medium text-purple-600">₹{auction.ownerBalanceAfter?.toLocaleString()}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Auctions;