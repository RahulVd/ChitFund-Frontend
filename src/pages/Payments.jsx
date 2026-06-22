import React, { useState, useCallback, useEffect } from 'react';
import { recordPayment, unmarkPayment, getPaymentsByGroup, getMembers, getAuctions, recordOwnerPayment, unmarkOwnerPayment, getOwnerPaymentsByGroup } from '../services/api';

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function PaymentDetailsForm({ onSubmit, onCancel, saving }) {
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState('UPI');
  const [otherMode, setOtherMode] = useState('');
  const [reference, setReference] = useState('');

  const handleSave = () => {
    onSubmit({
      paymentDate: date,
      paymentMode: mode,
      referenceNote: mode === 'OTHER' && otherMode ? `${otherMode}: ${reference}` : reference,
    });
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2" onClick={e => e.stopPropagation()}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Mode</label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {PAYMENT_MODES.map(m => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'OTHER' && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Specify mode</label>
          <input
            type="text"
            value={otherMode}
            onChange={e => setOtherMode(e.target.value)}
            placeholder="e.g. Cheque"
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Reference / note (optional)</label>
        <input
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="e.g. UPI txn ID, cheque number"
          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Mark Paid'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MonthBox({ groupId, monthNumber, totalMembers, allMembers, allPayments, allOwnerPayments, monthlyContribution, onPaymentChange, expanded, onToggleExpand }) {  const [toggling, setToggling] = useState(null);
  const [ownerToggling, setOwnerToggling] = useState(false);
  const [detailsOpenFor, setDetailsOpenFor] = useState(null);

  const monthPayments = allPayments.filter(p => p.monthNumber === monthNumber);
  const paidMemberIds = new Set(monthPayments.map(p => p.member?.id));
  const paidCount = paidMemberIds.size;

  const ownerPayment = allOwnerPayments.find(p => p.monthNumber === monthNumber);
  const ownerPaid = !!ownerPayment;

  const members = allMembers.map(m => {
    const payment = monthPayments.find(p => p.member?.id === m.id);
    return {
      memberId: m.id,
      memberName: m.name,
      paid: paidMemberIds.has(m.id),
      amountPaid: payment?.amountPaid ?? null,
      paymentDate: payment?.paymentDate ?? null,
      paymentMode: payment?.paymentMode ?? null,
      referenceNote: payment?.referenceNote ?? null,
    };
  });

  const handleTogglePaid = async (member, details) => {
    if (toggling) return;
    setToggling(member.memberId);
    try {
      if (member.paid) {
        await unmarkPayment(groupId, member.memberId, monthNumber);
      } else {
        await recordPayment({
          chitGroupId: groupId,
          memberId: member.memberId,
          monthNumber: monthNumber,
          amountPaid: monthlyContribution,
          ...(details || {}),
        });
      }
      setDetailsOpenFor(null);
      onPaymentChange();
    } catch (e) {
      console.error('Payment toggle failed', e);
    } finally {
      setToggling(null);
    }
  };

  const handleToggleOwnerPaid = async () => {
    if (ownerToggling) return;
    setOwnerToggling(true);
    try {
      if (ownerPaid) {
        await unmarkOwnerPayment(groupId, monthNumber);
      } else {
        await recordOwnerPayment(groupId, monthNumber);
      }
      onPaymentChange();
    } catch (e) {
      console.error('Owner payment toggle failed', e);
    } finally {
      setOwnerToggling(false);
    }
  };

  const totalSlots = totalMembers + 1;
  const paidSlots = paidCount + (ownerPaid ? 1 : 0);

  const allPaid = paidSlots === totalSlots && totalSlots > 0;
  const nonePaid = paidSlots === 0;
  const pillColor = allPaid
    ? 'bg-emerald-100 text-emerald-700'
    : nonePaid
    ? 'bg-red-50 text-red-500'
    : 'bg-amber-50 text-amber-600';

  const totalCollected = members
    .filter(m => m.paid && m.amountPaid)
    .reduce((sum, m) => sum + Number(m.amountPaid), 0)
    + (ownerPaid && ownerPayment.amountPaid ? Number(ownerPayment.amountPaid) : 0);

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden
      ${expanded ? 'border-indigo-200 shadow-md' : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'}
      bg-white`}>

      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
            ${expanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
            {monthNumber}
          </div>
          <span className="font-semibold text-gray-800 text-sm">Month {monthNumber}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pillColor}`}>
            {paidSlots}/{totalSlots} paid
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3">

          <button
            onClick={handleToggleOwnerPaid}
            disabled={ownerToggling}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all text-left mb-2
              ${ownerPaid
                ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer'
                : 'border-red-100 bg-red-50 hover:bg-red-100 cursor-pointer'}
              ${ownerToggling ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${ownerPaid ? 'bg-purple-200 text-purple-700' : 'bg-red-200 text-red-600'}`}>
                👑
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Owner</p>
                {ownerPaid && ownerPayment?.paymentDate && (
                  <p className="text-xs text-gray-400">Paid on {ownerPayment.paymentDate}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ownerPaid && ownerPayment?.amountPaid != null && (
                <span className="text-xs font-semibold text-purple-700">
                  ₹{Number(ownerPayment.amountPaid).toLocaleString('en-IN')}
                </span>
              )}
              {ownerToggling ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : ownerPaid ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Paid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tap to mark paid
                </span>
              )}
            </div>
          </button>

          {members.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No members found.</p>
          ) : (
            <div className="grid gap-2">
              {members.map(member => {
                const isToggling = toggling === member.memberId;
                const detailsOpen = detailsOpenFor === member.memberId;
                return (
                  <div key={member.memberId}>
                    <button
                      onClick={() => handleTogglePaid(member)}
                      disabled={isToggling}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all text-left
                        ${member.paid
                          ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                          : 'border-red-100 bg-red-50 hover:bg-red-100 cursor-pointer'}
                        ${isToggling ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                          ${member.paid ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-600'}`}>
                          {member.memberName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{member.memberName}</p>
                          {member.paid && member.paymentDate && (
                            <p className="text-xs text-gray-400">
                              Paid on {member.paymentDate}
                              {member.paymentMode && ` · ${member.paymentMode.replace('_', ' ')}`}
                              {member.referenceNote && ` · ${member.referenceNote}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.paid && member.amountPaid != null && (
                          <span className="text-xs font-semibold text-emerald-700">
                            ₹{Number(member.amountPaid).toLocaleString('en-IN')}
                          </span>
                        )}
                        {isToggling ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : member.paid ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Tap to mark paid
                          </span>
                        )}
                      </div>
                    </button>

                    {!member.paid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsOpenFor(detailsOpen ? null : member.memberId);
                        }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1 ml-1"
                      >
                        {detailsOpen ? '− Hide details' : '+ Add date / mode / reference'}
                      </button>
                    )}

                    {detailsOpen && (
                      <PaymentDetailsForm
                        saving={isToggling}
                        onCancel={() => setDetailsOpenFor(null)}
                        onSubmit={(details) => handleTogglePaid(member, details)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(members.some(m => m.paid) || ownerPaid) && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>Total collected this month</span>
              <span className="font-semibold text-gray-700">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Payments({ selectedGroup, onPaymentChange }) { // ← add onPaymentChange here{
  const [allPayments, setAllPayments] = useState([]);
  const [allOwnerPayments, setAllOwnerPayments] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});

const toggleExpanded = (month) => {
  const scrollY = window.scrollY;
  setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  requestAnimationFrame(() => window.scrollTo(0, scrollY));
};  const [duration, setDuration] = useState(
    Math.round((selectedGroup?.totalChitAmount || 0) / (selectedGroup?.monthlyContribution || 1))
  );

  const groupId = selectedGroup?.id;

  const fetchAll = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [paymentsRes, membersRes, auctionsRes, ownerPaymentsRes] = await Promise.all([
        getPaymentsByGroup(groupId),
        getMembers(groupId),
        getAuctions(groupId),
        getOwnerPaymentsByGroup(groupId),
      ]);
      setAllPayments(paymentsRes.data);
      setAllMembers(membersRes.data);
      setAllOwnerPayments(ownerPaymentsRes.data);

      const maxAuctionMonth = auctionsRes.data.reduce((max, a) => Math.max(max, a.monthNumber), 0);
const calculatedDuration = Math.round(
  selectedGroup.totalChitAmount / selectedGroup.monthlyContribution
);
setDuration(maxAuctionMonth || calculatedDuration);
    } catch (e) {
      console.error('Fetch failed', e);
    } finally {
      setLoading(false);
    }
}, [groupId, selectedGroup?.totalChitAmount, selectedGroup?.monthlyContribution]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!selectedGroup) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">Select a chit group to view payments</p>
      </div>
    );
  }

  const totalMembers = selectedGroup.totalMembers || selectedGroup.noOfMembers || allMembers.length;
  const monthlyContribution = selectedGroup.monthlyContribution || selectedGroup.chitAmount || 0;
  const months = Array.from({ length: duration }, (_, i) => i + 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">
          {selectedGroup.chitName} · {duration} months · {totalMembers} members + owner
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-indigo-700">
          Click any month to expand. <span className="text-purple-600 font-semibold">Purple = owner</span> · <span className="text-emerald-600 font-semibold">Green = member paid</span> · <span className="text-red-500 font-semibold">Red = unpaid</span>, tap to mark paid. Use "+ Add date / mode / reference" to record details. Fixed amount: ₹{Number(monthlyContribution).toLocaleString('en-IN')}.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {months.map(month => (
           <MonthBox
  key={month}
  groupId={groupId}
  monthNumber={month}
  totalMembers={totalMembers}
  allMembers={allMembers}
  allPayments={allPayments}
  allOwnerPayments={allOwnerPayments}
  monthlyContribution={monthlyContribution}
  expanded={expandedMonths[month] || false}
  onToggleExpand={() => toggleExpanded(month)}
  onPaymentChange={() => {
    fetchAll();
    onPaymentChange();
  }}
/>
          ))}
        </div>
      )}
    </div>
  );
}

export default Payments;
