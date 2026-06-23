import React, { useEffect, useState } from 'react';
import { getMembers, addMember, updateMember, deleteMember } from '../services/api';

function Members({ selectedGroup }) {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const CHIT_GROUP_ID = selectedGroup?.id;

  useEffect(() => {
    if (!CHIT_GROUP_ID) return;
    fetchMembers();
  }, [CHIT_GROUP_ID]);

  if (!selectedGroup) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Please select a chit group first.</p>
    </div>
  );

  const fetchMembers = () => {
    getMembers(CHIT_GROUP_ID)
      .then(res => setMembers(res.data))
      .catch(err => console.error(err));
  };

  const handleAdd = () => {
    if (!name || !phone) return setMessage('Name and phone are required');
    if (members.length >= selectedGroup.totalMembers) {
      return setMessage(`Max ${selectedGroup.totalMembers} members allowed.`);
    }
    addMember({ name, phone, address, chitGroup: { id: CHIT_GROUP_ID } })
      .then(() => {
        setMessage('Member added successfully!');
        setName(''); setPhone(''); setAddress('');
        setShowForm(false);
        fetchMembers();
      })
      .catch(() => setMessage('Error adding member'));
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setName(member.name);
    setPhone(member.phone);
    setAddress(member.address);
    setShowForm(true);
  };

  const handleUpdate = () => {
    if (!name || !phone) return setMessage('Name and phone are required');
    updateMember(editingMember.id, {
      name, phone, address,
      chitGroup: { id: CHIT_GROUP_ID }
    })
      .then(() => {
        setMessage('Member updated successfully!');
        setName(''); setPhone(''); setAddress('');
        setEditingMember(null);
        setShowForm(false);
        fetchMembers();
      })
      .catch(() => setMessage('Error updating member'));
  };

  const handleDelete = (id, memberName) => {
    if (!window.confirm(`Delete ${memberName}?`)) return;
    deleteMember(id)
      .then(() => fetchMembers())
      .catch(() => setMessage('Error deleting member'));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMember(null);
    setName(''); setPhone(''); setAddress('');
    setMessage('');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Members</h1>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">
            {members.length} / {selectedGroup.totalMembers} members
          </p>
        </div>
        {members.length < selectedGroup.totalMembers && (
          <button
            onClick={() => { setEditingMember(null); setShowForm(!showForm); }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 min-h-[44px]"
          >
            + Add Member
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm lg:text-base">
            {editingMember ? 'Edit Member' : 'New Member'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div>
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Name</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Phone</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                placeholder="Phone number"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm text-gray-500 mb-1 block">Address</label>
              <input
                className="border border-gray-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                placeholder="Address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          </div>
          {message && (
            <p className={`mt-3 text-xs lg:text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 mt-4">
            <button
              onClick={editingMember ? handleUpdate : handleAdd}
              className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 min-h-[44px]"
            >
              {editingMember ? 'Update' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 active:bg-gray-300 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Members List - Card view on mobile, Table on desktop */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-4 text-xs lg:text-sm text-gray-500 font-medium">#</th>
              <th className="text-left p-4 text-xs lg:text-sm text-gray-500 font-medium">Name</th>
              <th className="text-left p-4 text-xs lg:text-sm text-gray-500 font-medium">Phone</th>
              <th className="text-left p-4 text-xs lg:text-sm text-gray-500 font-medium">Address</th>
              <th className="text-left p-4 text-xs lg:text-sm text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 text-xs lg:text-sm text-gray-400">{index + 1}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 font-semibold text-xs lg:text-sm w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{member.name}</span>
                  </div>
                </td>
                <td className="p-4 text-xs lg:text-sm text-gray-600">{member.phone}</td>
                <td className="p-4 text-xs lg:text-sm text-gray-600">{member.address}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-medium hover:bg-blue-100 active:bg-blue-200 min-h-[32px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="bg-red-50 text-red-500 px-2 py-1 rounded-lg text-xs font-medium hover:bg-red-100 active:bg-red-200 min-h-[32px]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 text-xs lg:text-sm text-gray-400 border-t border-gray-50">
          Showing {members.length} of {selectedGroup.totalMembers} members
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid gap-3">
        {members.map((member, index) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 font-semibold text-sm w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{index + 1}. {member.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{member.phone}</p>
                </div>
              </div>
            </div>
            {member.address && (
              <p className="text-xs text-gray-600 mb-3">📍 {member.address}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(member)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 active:bg-blue-200 min-h-[40px]"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(member.id, member.name)}
                className="flex-1 bg-red-50 text-red-500 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-100 active:bg-red-200 min-h-[40px]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5h4m-7 2h10M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No members added yet</p>
        </div>
      )}
    </div>
  );
}

export default Members;
