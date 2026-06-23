import axios from 'axios';


const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

// Chit Group
export const getChitGroup = (id) => API.get(`/chits/${id}`);
export const getAllChitGroups = () => API.get('/chits');


// Members
export const getMembers = (chitGroupId) => API.get(`/members/chit/${chitGroupId}`);
export const addMember = (member) => API.post('/members', member);
export const updateMember = (id, member) => API.put(`/members/${id}`, member);
export const deleteMember = (id) => API.delete(`/members/${id}`);

// Payments
export const recordPayment = (data) => API.post('/payments/record', data);
export const unmarkPayment = (chitGroupId, memberId, monthNumber) =>
  API.delete(`/payments/group/${chitGroupId}/month/${monthNumber}/member/${memberId}`);
export const getPaymentsByGroup = (chitGroupId) => API.get(`/payments/group/${chitGroupId}`);
export const getUnpaidMembers = (chitGroupId, monthNumber) => API.get(`/payments/group/${chitGroupId}/month/${monthNumber}/unpaid`);
export const getMonthlySummary = (chitGroupId, monthNumber) => API.get(`/payments/group/${chitGroupId}/month/${monthNumber}/summary`);


// Auctions
export const recordAuction = (data) => API.post('/auctions/record', data);
export const getAuctions = (chitGroupId) => API.get(`/auctions/group/${chitGroupId}`);
export const getOwnerBalance = (chitGroupId) => API.get(`/auctions/group/${chitGroupId}/owner-balance`);
export const getLastMonthPayout = (chitGroupId) => API.get(`/auctions/group/${chitGroupId}/last-month-payout`);

//owner-month
export const triggerOwnerMonth = (data) => API.post('/owner-month/trigger', data);
export const getOwnerMonths = (chitGroupId) => API.get(`/owner-month/group/${chitGroupId}`);

// Dashboard
export const getDashboard = (chitGroupId) => API.get(`/dashboard/group/${chitGroupId}`);

// Settlements
export const settleGroup = (chitGroupId) => API.post(`/settlements/group/${chitGroupId}/settle`);
export const getSettlements = (chitGroupId) => API.get(`/settlements/group/${chitGroupId}`);



// Owner Payments
export const recordOwnerPayment = (chitGroupId, monthNumber) =>
  API.post(`/owner-payments/group/${chitGroupId}/month/${monthNumber}`);
export const unmarkOwnerPayment = (chitGroupId, monthNumber) =>
  API.delete(`/owner-payments/group/${chitGroupId}/month/${monthNumber}`);
export const getOwnerPaymentsByGroup = (chitGroupId) =>
  API.get(`/owner-payments/group/${chitGroupId}`);