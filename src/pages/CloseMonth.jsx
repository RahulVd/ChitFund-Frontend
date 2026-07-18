import React, { useEffect, useState } from 'react';
import {
  getMembers,
  getAuctions,
  getOwnerMonths,
  getUnpaidMembers,
  recordPayment,
  unmarkPayment,
  recordAuction,
  triggerOwnerMonth,
} from '../services/api';

function CloseMonth({ selectedGroup }) {
  const [members, setMembers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [ownerMonths, setOwnerMonths] = useState([]);
  const [unpaidIds, setUnpaidIds] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);

  const [winnerId, setWinnerId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isDoubleChit, setIsDoubleChit] = useState(false);
  const [isOwnerMonth, setIsOwnerMonth] = useState(false);

  const [paymentMessage, setPaymentMessage] = useState('');
  const [auctionMessage, setAuctionMessage] = useState('');

  const CHIT_GROUP_ID = selectedGroup?.id;

  const computeCurrentMonth = (auctionsData, ownerMonthsData) => {
    const allMonths = new Set([
      ...auctionsData.map(a => a.monthNumber),
      ...ownerMonthsData.map(o => o.monthNumber),
    ]);
    if (allMonths.size === 0) return 1;
    return Math.max(...allMonths) + 1;
  };

  const fetchAll = () => {
    if (!CHIT_GROUP_ID) return;
    Promise.all([
      getMembers(CHIT_GROUP_ID),
      getAuctions(CHIT_GROUP_ID),
      getOwnerMonths(CHIT_GROUP_ID),
    ]).then(([membersRes, auctionsRes, ownerMonthsRes]) => {
      setMembers(membersRes.data);
      setAuctions(auctionsRes.data);
      setOwnerMonths(ownerMonthsRes.data);
      const month = computeCurrentMonth(auctionsRes.data, ownerMonthsRes.data);
      setCurrentMonth(month);
      getUnpaidMembers(CHIT_GROUP_ID, month).then(res => {
        setUnpaidIds(res.data.map(m => m.id));
      });
    });
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CHIT_GROUP_ID]);

  if (!selectedGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Please select a chit group first.</p>
      </div>
    );
  }

  if (selectedGroup.status === 'COMPLETED') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">This group is completed — nothing left to close.</p>
      </div>
    );
  }

  const wonMemberIds = new Set(auctions.map(a => a.winner.id));
  const availableMembers = members.filter(m => !wonMemberIds.has(m.id));
  const existingAuctionsThisMonth = auctions.filter(a => a.monthNumber === currentMonth);
  const alreadyOwnerMonth = ownerMonths.some(o => o.monthNumber === currentMonth);

  const paidCount = members.length - unpaidIds.length;

  const togglePayment = (memberId, isPaid) => {
    setPaymentMessage('');
    if (isPaid) {
      // was paid, now unmark
      unmarkPayment(CHIT_GROUP_ID, memberId, currentMonth)
        .then(() => setUnpaidIds(prev => [...prev, memberId]))
        .catch(err => setPaymentMessage(err.response?.data?.message || 'Error updating payment'));
    } else {
      recordPayment({
        chitGroupId: CHIT_GROUP_ID,
        memberId,
        monthNumber: currentMonth,
        amountPaid: selectedGroup.monthlyContribution,
      })
        .then(() => setUnpaidIds(prev => prev.filter(id => id !== memberId)))
        .catch(err => setPaymentMessage(err.response?.data?.message || 'Error recording payment'));
    }
  };

  const handleRecordAuction = () => {
    if (!winnerId || !bidAmount) {
      return setAuctionMessage('Select a winner and enter a bid amount');
    }

    const winnerName = availableMembers.find(m => m.id === parseInt(winnerId))?.name || 'this member';
    const chitLabel = isDoubleChit ? '2nd winner (double chit)' : 'winner';
    const confirmed = window.confirm(
      `Are you sure? This will record ${winnerName} as the ${chitLabel} for month ${currentMonth} with a bid of ₹${Number(bidAmount).toLocaleString('en-IN')}. This cannot be undone from the UI.`
    );
    if (!confirmed) return;

    recordAuction({
      chitGroupId: CHIT_GROUP_ID,
      winnerId: parseInt(winnerId),
      monthNumber: currentMonth,
      bidAmount: parseFloat(bidAmount),
      doubleChit: isDoubleChit,
    })
      .then(() => {
        setAuctionMessage(isDoubleChit ? 'Second winner recorded! Double chit complete.' : 'Auction recorded successfully.');
        setWinnerId(''); setBidAmount(''); setIsDoubleChit(false);
        fetchAll();
      })
      .catch(err => setAuctionMessage(err.response?.data?.message || 'Error recording auction'));
  };

  const handleTriggerOwnerMonth = () => {
    const confirmed = window.confirm(
      `Are you sure? This will mark month ${currentMonth} as the Owner's Month and add ₹${selectedGroup.totalChitAmount?.toLocaleString()} to the owner balance. This cannot be undone from the UI.`
    );
    if (!confirmed) return;

    triggerOwnerMonth({ chitGroupId: CHIT_GROUP_ID, monthNumber: currentMonth })
      .then(() => {
        setAuctionMessage('Owner month triggered! Moving to next month.');
        setIsOwnerMonth(false);
        fetchAll();
      })
      .catch(err => setAuctionMessage(err.response?.data?.message || 'Error triggering owner month'));
  };

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
          Close Month {currentMonth}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{selectedGroup.chitName}</p>
      </div>

      {/* Step 1: Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 text-sm lg:text-base">
            Step 1 — Who paid this month?
          </h3>
          <span className="text-xs lg:text-sm text-gray-500">{paidCount}/{members.length} paid</span>
        </div>
        <div className="flex flex-col gap-2">
          {members.map(m => {
            const isPaid = !unpaidIds.includes(m.id);
            return (
              <label
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={() => togglePayment(m.id, isPaid)}
                  className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-800">{m.name}</span>
                {isPaid && <span className="ml-auto text-xs text-green-600 font-medium">Paid</span>}
              </label>
            );
          })}
        </div>
        {paymentMessage && (
          <p className="mt-3 text-xs lg:text-sm text-red-500">{paymentMessage}</p>
        )}
      </div>

      {/* Step 2: Auction / Owner Month */}
      {alreadyOwnerMonth || existingAuctionsThisMonth.length >= 2 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm lg:text-base">
            Step 2 — This month
          </h3>
          <p className="text-sm text-gray-500">
            {alreadyOwnerMonth
              ? '👑 Already recorded as an Owner Month.'
              : 'Both winners recorded for this month.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm lg:text-base">
              Step 2 — Who won the auction?
            </h3>
            <label className="flex items-center gap-2 text-xs lg:text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isOwnerMonth}
                onChange={e => setIsOwnerMonth(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
              👑 This is the Owner's Month
            </label>
          </div>

          {isOwnerMonth ? (
            <div>
              <p className="text-xs lg:text-sm text-gray-400 mb-4">
                ₹{selectedGroup.totalChitAmount?.toLocaleString()} will be added to the owner balance — no bidding this month.
              </p>
              <button
                onClick={handleTriggerOwnerMonth}
                className="w-full lg:w-auto bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 min-h-[44px]"
              >
                Confirm Owner's Month
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4">
              <div>
                <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Winner</label>
                <select
                  className="border border-gray-200 rounded-lg p-2 w-full text-sm min-h-[44px]"
                  value={winnerId}
                  onChange={e => setWinnerId(e.target.value)}
                >
                  <option value="">Select Winner</option>
                  {availableMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Bid (₹)</label>
                <input
                  className="border border-gray-200 rounded-lg p-2 w-full text-sm min-h-[44px]"
                  placeholder="e.g. 20000"
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-end pb-0 lg:pb-2">
                <label className={`flex items-center gap-2 text-xs lg:text-sm cursor-pointer ${existingAuctionsThisMonth.length === 1 ? 'text-gray-700' : 'text-gray-300'}`}>
                  <input
                    type="checkbox"
                    checked={isDoubleChit}
                    disabled={existingAuctionsThisMonth.length !== 1}
                    onChange={e => setIsDoubleChit(e.target.checked)}
                    className="w-4 h-4 rounded accent-green-600 cursor-pointer"
                  />
                  <span>⚡ Double Chit</span>
                </label>
                {existingAuctionsThisMonth.length !== 1 && (
                  <span className="text-xs text-gray-400 mt-1">Enable after first winner</span>
                )}
                {existingAuctionsThisMonth.length === 1 && !isDoubleChit && (
                  <span className="text-xs text-gray-400 mt-1">First winner recorded — check for second winner</span>
                )}
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRecordAuction}
                  className="w-full bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px]"
                >
                  {isDoubleChit ? 'Record 2nd Winner' : 'Record Winner'}
                </button>
              </div>
            </div>
          )}
          {auctionMessage && (
            <p className="mt-3 text-xs lg:text-sm text-gray-600">{auctionMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CloseMonth;