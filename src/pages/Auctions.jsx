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

  const auctionsByMonth = auctions.reduce((acc, auction) => {
    const key = auction.monthNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(auction);
    return acc;
  }, {});

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
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Auctions</h1>
        <p className="text-gray-500 text-sm mt-1">{selectedGroup.chitName}</p>
      </div>

      {/* Owner Balance Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
        <p className="text-xs lg:text-sm text-gray-500 mb-1">Owner Balance</p>
        <p className="text-2xl lg:text-3xl font-bold text-purple-600">₹{ownerBalance?.toLocaleString()}</p>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('auction')}
          className={`px-4 lg:px-5 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'auction' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          🏆 Record Auction
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          className={`px-4 lg:px-5 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'owner' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          👑 Owner Month
        </button>
        {selectedGroup.status === 'COMPLETED' && (
          <button
            onClick={() => setActiveTab('settle')}
            className={`px-4 lg:px-5 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'settle' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            🏁 Settle
          </button>
        )}
      </div>

      {/* Auction Form */}
      {activeTab === 'auction' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm lg:text-base">Record Auction Winner</h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4">
            <div>
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Winner</label>
              <select
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
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
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Month</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                placeholder="e.g. 1"
                type="number"
                value={monthNumber}
                onChange={e => setMonthNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Bid (₹)</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                placeholder="e.g. 20000"
                type="number"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col justify-end pb-0 lg:pb-2">
              <label className={`flex items-center gap-2 text-xs lg:text-sm cursor-pointer ${existingWinnerForTypedMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={isDoubleChit}
                  disabled={!existingWinnerForTypedMonth}
                  onChange={e => setIsDoubleChit(e.target.checked)}
                  className="w-4 h-4 rounded accent-green-600 cursor-pointer"
                />
                <span>⚡ Double</span>
              </label>
              {!existingWinnerForTypedMonth && monthNumber && (
                <span className="text-xs text-gray-400 mt-1">No winner yet</span>
              )}
            </div>
          </div>
          {message && (
            <p className={`mt-3 text-xs lg:text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
          <button onClick={handleRecord}
            className="mt-4 w-full lg:w-auto bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 min-h-[44px]">
            Record Auction
          </button>
        </div>
      )}

      {/* Owner Month Form */}
      {activeTab === 'owner' && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 border-2 p-4 lg:p-6 mb-4 lg:mb-6">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm lg:text-base">👑 Trigger Owner Month</h3>
          <p className="text-xs lg:text-sm text-gray-400 mb-4">
            ₹{selectedGroup.totalChitAmount?.toLocaleString()} added to owner balance.
          </p>
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-end">
            <div className="flex-1 lg:flex-none">
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Month Number</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                placeholder="e.g. 2"
                type="number"
                value={ownerMonthNumber}
                onChange={e => setOwnerMonthNumber(e.target.value)}
              />
            </div>
            <button onClick={handleOwnerMonth}
              className="w-full lg:w-auto bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 active:bg-purple-800 min-h-[44px]">
              Trigger
            </button>
          </div>
          {ownerMessage && (
            <p className={`mt-3 text-xs lg:text-sm ${ownerMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {ownerMessage}
            </p>
          )}
        </div>
      )}

      {/* Settle Group Form */}
      {activeTab === 'settle' && (
        <div className="bg-white rounded-xl shadow-sm border border-green-100 border-2 p-4 lg:p-6 mb-4 lg:mb-6">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm lg:text-base">🏁 Settle Group</h3>
          <p className="text-xs lg:text-sm text-gray-400 mb-4">
            Distribute balance among {selectedGroup.totalMembers} members.
          </p>

          {!settlements ? (
            <>
              <div className="bg-green-50 rounded-lg p-3 lg:p-4 mb-4 inline-block">
                <p className="text-xs text-gray-500">Each member receives</p>
                <p className="text-lg lg:text-xl font-bold text-green-700">
                  ₹{(ownerBalance / selectedGroup.totalMembers).toFixed(2)}
                </p>
              </div>
              <button onClick={handleSettle} disabled={settling}
                className="w-full lg:w-auto bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 active:bg-green-800 min-h-[44px]">
                {settling ? 'Settling...' : 'Settle & Distribute'}
              </button>
            </>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b text-xs lg:text-sm">
                    <th className="py-2 pr-2">Member</th>
                    <th className="py-2 text-right">Dividend</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(s => (
                    <tr key={s.id} className="border-b last:border-0 text-xs lg:text-sm">
                      <td className="py-2 pr-2">{s.member.name}</td>
                      <td className="py-2 text-right text-green-700 font-medium">₹{s.dividendAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {settleMessage && (
            <p className={`mt-3 text-xs lg:text-sm ${settleMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {settleMessage}
            </p>
          )}
        </div>
      )}

      {/* Timeline Table - Scrollable on mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 lg:p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm lg:text-base">Auction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs lg:text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-2 lg:p-4 text-gray-500 font-medium">Month</th>
                <th className="text-left p-2 lg:p-4 text-gray-500 font-medium">Type</th>
                <th className="text-left p-2 lg:p-4 text-gray-500 font-medium">Winner</th>
                <th className="text-right p-2 lg:p-4 text-gray-500 font-medium">Bid</th>
                <th className="text-right p-2 lg:p-4 text-gray-500 font-medium hidden sm:table-cell">Received</th>
                <th className="text-right p-2 lg:p-4 text-gray-500 font-medium hidden lg:table-cell">Balance</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map(month => {
                const monthAuctions = auctionsByMonth[month] || [];
                const isOwnerMonth = ownerMonths.find(o => o.monthNumber === month);
                const isDoubleChit = monthAuctions.length === 2;

                return (
                  <React.Fragment key={month}>
                    {isOwnerMonth && (
                      <tr className="bg-purple-50 border-b border-purple-100">
                        <td colSpan={6} className="p-2 lg:p-4 text-xs lg:text-sm">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                            👑 Owner Month {month}
                          </span>
                        </td>
                      </tr>
                    )}

                    {isDoubleChit && (
                      <tr className="bg-green-50 border-b border-green-100">
                        <td colSpan={6} className="px-2 lg:px-4 py-2">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            ⚡ Double Chit — Month {month}
                          </span>
                        </td>
                      </tr>
                    )}

                    {monthAuctions.map((auction, index) => (
                      <tr key={auction.id} className={`border-b border-gray-50 hover:bg-gray-50 text-xs lg:text-sm ${isDoubleChit ? 'bg-green-50/30' : ''}`}>
                        <td className="p-2 lg:p-4 text-gray-700">
                          {!isDoubleChit ? `Month ${auction.monthNumber}` : index === 0 ? '└ 1st' : '└ 2nd'}
                        </td>
                        <td className="p-2 lg:p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDoubleChit ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isDoubleChit ? '⚡' : 'Normal'}
                          </span>
                        </td>
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-yellow-100 text-yellow-600 font-semibold text-xs w-7 h-7 rounded-full flex items-center justify-center">
                              {auction.winner.name.charAt(0)}
                            </div>
                            <span className="hidden sm:inline text-gray-800">{auction.winner.name}</span>
                          </div>
                        </td>
                        <td className="p-2 lg:p-4 text-right text-gray-700">₹{auction.bidAmount?.toLocaleString()}</td>
                        <td className="p-2 lg:p-4 text-right text-green-600 font-semibold hidden sm:table-cell">₹{auction.receivedAmount?.toLocaleString()}</td>
                        <td className="p-2 lg:p-4 text-right text-purple-600 font-medium hidden lg:table-cell">₹{auction.ownerBalanceAfter?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Auctions;
