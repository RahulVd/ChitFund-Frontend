import React, { useState, useEffect } from 'react';
import {
  getMeetingsByGroup,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getUnpaidMembers,
  getMembers,
} from '../services/api';

function Reminders({ selectedGroup }) {
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [unpaid, setUnpaid] = useState([]);
  const [message, setMessage] = useState('');

  // Meeting form
  const [editingId, setEditingId] = useState(null);
  const [formMonth, setFormMonth] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // WhatsApp section
  const [waMonth, setWaMonth] = useState('');
  const [waMessage, setWaMessage] = useState('');

  const CHIT_GROUP_ID = selectedGroup?.id;

  // Fetch meetings & members on group change
  useEffect(() => {
    if (!CHIT_GROUP_ID) return;
    getMeetingsByGroup(CHIT_GROUP_ID)
      .then(res => setMeetings(res.data))
      .catch(err => setMessage(err.response?.data?.message || 'Error fetching meetings'));

    getMembers(CHIT_GROUP_ID)
      .then(res => setMembers(res.data))
      .catch(err => console.error(err));
  }, [CHIT_GROUP_ID]);

  if (!selectedGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Please select a chit group first.</p>
      </div>
    );
  }

  // ── Meeting CRUD ──────────────────────────────────────────────

  const resetForm = () => {
    setEditingId(null);
    setFormMonth('');
    setFormLink('');
    setFormNotes('');
    setMessage('');
  };

  const handleSave = () => {
    if (!formMonth || !formLink) {
      return setMessage('Month number and Meet link are required');
    }

    const payload = {
      chitGroupId: CHIT_GROUP_ID,
      monthNumber: parseInt(formMonth),
      meetLink: formLink.trim(),
      notes: formNotes.trim(),
    };

    const action = editingId
      ? updateMeeting(editingId, payload)
      : createMeeting(payload);

    action
      .then(() => {
        setMessage(editingId ? 'Meeting updated!' : 'Meeting added!');
        resetForm();
        return getMeetingsByGroup(CHIT_GROUP_ID).then(res => setMeetings(res.data));
      })
      .catch(err => setMessage(err.response?.data?.message || 'Error saving meeting'));
  };

  const handleEdit = (m) => {
    setEditingId(m.id);
    setFormMonth(m.monthNumber);
    setFormLink(m.meetLink);
    setFormNotes(m.notes || '');
    setMessage('');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this meeting link?')) return;
    deleteMeeting(id)
      .then(() => {
        setMessage('Meeting deleted.');
        getMeetingsByGroup(CHIT_GROUP_ID).then(res => setMeetings(res.data));
      })
      .catch(err => setMessage(err.response?.data?.message || 'Error deleting meeting'));
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => setMessage('Link copied!'));
  };

  // ── WhatsApp helpers ──────────────────────────────────────────

  const getMeetLinkForMonth = (monthNum) => {
    const meeting = meetings.find(m => m.monthNumber === parseInt(monthNum));
    return meeting?.meetLink || null;
  };

  const fetchUnpaid = () => {
    if (!waMonth) return setMessage('Please enter a month number');
    setMessage('');
    getUnpaidMembers(CHIT_GROUP_ID, waMonth)
      .then(res => {
        setUnpaid(res.data);
        setWaMessage('');
      })
      .catch(err => setMessage(err.response?.data?.message || 'Error fetching unpaid members'));
  };

  const openWhatsApp = (phone, text) => {
    const cleaned = String(phone).replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleaned}?text=${encoded}`, '_blank');
  };

  const sendPaymentReminder = (member) => {
    const text =
      `Hi ${member.name} \uD83D\uDC4B\n` +
      `\uD83D\uDCDD Payment Reminder\n` +
      `Group: ${selectedGroup.chitName}\n` +
      `Month: ${waMonth}\n` +
      `Amount: \u20B9${selectedGroup.monthlyContribution?.toLocaleString('en-IN')}\n` +
      `Please pay at the earliest. \uD83D\uDE4F`;
    openWhatsApp(member.phone, text);
  };

  const sendMeetingInvite = (member) => {
    const link = getMeetLinkForMonth(waMonth);
    if (!link) {
      return setMessage(`No meeting link found for month ${waMonth}. Add it in the Meeting Links section above.`);
    }
    const text =
      `Hi ${member.name} \uD83D\uDC4B\n` +
      `\uD83D\uDCC5 Auction Meeting\n` +
      `Group: ${selectedGroup.chitName}\n` +
      `Month: ${waMonth}\n` +
      `\uD83D\uDD17 Join: ${link}\n` +
      `Please join on time. \uD83D\uDE4F`;
    openWhatsApp(member.phone, text);
  };

  const sendBulkMeetingInvite = () => {
    const link = getMeetLinkForMonth(waMonth);
    if (!link) {
      return setMessage(`No meeting link found for month ${waMonth}. Add it in the Meeting Links section above.`);
    }
    const text =
      `Hi \uD83D\uDC4B\n` +
      `\uD83D\uDCC5 Auction Meeting\n` +
      `Group: ${selectedGroup.chitName}\n` +
      `Month: ${waMonth}\n` +
      `\uD83D\uDD17 Join: ${link}\n` +
      `Please join on time. \uD83D\uDE4F`;
    // Open WhatsApp with first member as a starting point
    if (members.length > 0) {
      openWhatsApp(members[0].phone, text);
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Reminders</h1>
        <p className="text-gray-500 text-sm mt-1">{selectedGroup.chitName}</p>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-4 py-2 mb-4 text-sm">
          {message}
        </div>
      )}

      {/* ─── Section 1: Meeting Links ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm lg:text-base">
          📌 Meeting Links
        </h3>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Month</label>
            <input
              className="border border-gray-200 rounded-lg p-2 w-full text-sm"
              type="number"
              min="1"
              placeholder="e.g. 1"
              value={formMonth}
              onChange={e => setFormMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Google Meet Link</label>
            <input
              className="border border-gray-200 rounded-lg p-2 w-full text-sm"
              type="url"
              placeholder="https://meet.google.com/..."
              value={formLink}
              onChange={e => setFormLink(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
            <input
              className="border border-gray-200 rounded-lg p-2 w-full text-sm"
              placeholder="e.g. Agenda item"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {meetings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No meeting links added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Month</th>
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Meet Link</th>
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Notes</th>
                  <th className="text-left p-3 text-xs text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings
                  .sort((a, b) => a.monthNumber - b.monthNumber)
                  .map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-800">{m.monthNumber}</td>
                      <td className="p-3 text-sm">
                        <a
                          href={m.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate block max-w-[250px]"
                        >
                          {m.meetLink}
                        </a>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{m.notes || '—'}</td>
                      <td className="p-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyLink(m.meetLink)}
                            className="text-gray-500 hover:text-blue-600 text-xs px-2 py-1 rounded border border-gray-200 hover:border-blue-300"
                            title="Copy link"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleEdit(m)}
                            className="text-gray-500 hover:text-green-600 text-xs px-2 py-1 rounded border border-gray-200 hover:border-green-300"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="text-gray-500 hover:text-red-600 text-xs px-2 py-1 rounded border border-gray-200 hover:border-red-300"
                            title="Delete"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Section 2: WhatsApp Reminders ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm lg:text-base">
          📱 WhatsApp Reminders
        </h3>

        {/* Month selector */}
        <div className="flex gap-3 items-center mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Month Number</label>
            <input
              className="border border-gray-200 rounded-lg p-2 w-48 text-sm"
              type="number"
              min="1"
              placeholder="e.g. 1"
              value={waMonth}
              onChange={e => setWaMonth(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchUnpaid}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Show Unpaid
            </button>
            <button
              onClick={sendBulkMeetingInvite}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Send Meeting Invite
            </button>
          </div>
        </div>

        {waMessage && (
          <p className="text-xs text-red-500 mb-2">{waMessage}</p>
        )}

        {/* Unpaid members list */}
        {unpaid.length === 0 && waMonth && (
          <p className="text-sm text-green-600 py-3">
            All members have paid for month {waMonth}!
          </p>
        )}

        {unpaid.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">
              {unpaid.length} unpaid member{unpaid.length > 1 ? 's' : ''} — click to send WhatsApp reminder
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs text-gray-500 font-medium">Name</th>
                    <th className="text-left p-3 text-xs text-gray-500 font-medium">Phone</th>
                    <th className="text-left p-3 text-xs text-gray-500 font-medium">WhatsApp Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaid.map(member => (
                    <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-800">{member.name}</td>
                      <td className="p-3 text-sm text-gray-600">{member.phone || '—'}</td>
                      <td className="p-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendPaymentReminder(member)}
                            disabled={!member.phone}
                            className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-medium border border-green-200 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            \uD83D\uDCB0 Payment
                          </button>
                          <button
                            onClick={() => sendMeetingInvite(member)}
                            disabled={!member.phone}
                            className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-xs font-medium border border-purple-200 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            \uD83D\uDCC5 Meeting
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reminders;
