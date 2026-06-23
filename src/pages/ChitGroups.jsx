import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getAllChitGroups } from '../services/api';

function ChitGroups({ setSelectedGroup }) {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [chitName, setChitName] = useState('');
  const [totalMembers, setTotalMembers] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [startDate, setStartDate] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchGroups = () => {
    getAllChitGroups()
      .then(res => setGroups(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSelect = (group) => {
    setSelectedGroup(group);
    navigate('/dashboard');
  };

  const handleCreate = () => {
  if (!chitName || !totalMembers || !monthlyContribution || !startDate) {
    return setMessage('All fields are required');
  }
  const totalChitAmount = parseInt(totalMembers) * parseFloat(monthlyContribution);
  API.post('/chits', {
    chitName,
    totalMembers: parseInt(totalMembers),
    monthlyContribution: parseFloat(monthlyContribution),
    totalChitAmount,
    startDate,
    status: 'ACTIVE'
  })
    .then(() => {
      setMessage('Group created!');
      setShowForm(false);
      setChitName(''); setTotalMembers('');
      setMonthlyContribution(''); setStartDate('');
      fetchGroups();
    })
    .catch(() => setMessage('Error creating group'));
};

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chit Groups</h1>
          <p className="text-gray-500 mt-1">Select a group to manage</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Chit Group
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">New Chit Group</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Chit Name</label>
              <input className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Gold Chit" value={chitName} onChange={e => setChitName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Total Members</label>
              <input className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number" placeholder="e.g. 10" value={totalMembers} onChange={e => setTotalMembers(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Monthly Contribution (₹)</label>
              <input className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number" placeholder="e.g. 5000" value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Start Date</label>
              <input className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          {message && <p className="mt-3 text-sm text-red-500">{message}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Create Group
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-3 gap-4">
        {groups.map(group => (
          <div
            key={group.id}
            onClick={() => handleSelect(group)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-100 text-blue-600 font-bold text-lg w-12 h-12 rounded-xl flex items-center justify-center">
                {group.chitName.charAt(0)}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {group.status}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">{group.chitName}</h3>
            <p className="text-gray-500 text-sm mt-1">{group.totalMembers} Members</p>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
              <div>
                <p className="text-xs text-gray-400">Monthly</p>
                <p className="text-sm font-semibold text-gray-700">₹{group.monthlyContribution?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Pool</p>
                <p className="text-sm font-semibold text-gray-700">₹{group.totalChitAmount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChitGroups;