import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

// ─── Accounts ────────────────────────────────────────────────────────────────

export const getAccounts = async ({ includeArchived } = {}) => {
  const url = includeArchived ? `${API_URLS.FINANCE_ACCOUNTS}?includeArchived=true` : API_URLS.FINANCE_ACCOUNTS;
  const res = await api.get(url);
  return res.data;
};

export const archiveAccount = async (id, isArchived) => {
  const res = await api.put(`${API_URLS.FINANCE_ACCOUNTS}/${id}/archive`, { isArchived });
  return res.data;
};

export const createAccount = async (data) => {
  const res = await api.post(API_URLS.FINANCE_ACCOUNTS, data);
  return res.data;
};

export const updateAccount = async (id, data) => {
  const res = await api.put(`${API_URLS.FINANCE_ACCOUNTS}/${id}`, data);
  return res.data;
};

export const updateAccountPosition = async (id, x, y) => {
  const res = await api.put(`${API_URLS.FINANCE_ACCOUNTS}/${id}/position`, { x, y });
  return res.data;
};

export const deleteAccount = async (id) => {
  const res = await api.delete(`${API_URLS.FINANCE_ACCOUNTS}/${id}`);
  return res.data;
};

// ─── Groups ──────────────────────────────────────────────────────────────────

export const getGroups = async () => {
  const res = await api.get(API_URLS.FINANCE_GROUPS);
  return res.data;
};

export const createGroup = async (data) => {
  const res = await api.post(API_URLS.FINANCE_GROUPS, data);
  return res.data;
};

export const updateGroup = async (id, data) => {
  const res = await api.put(`${API_URLS.FINANCE_GROUPS}/${id}`, data);
  return res.data;
};

export const deleteGroup = async (id) => {
  const res = await api.delete(`${API_URLS.FINANCE_GROUPS}/${id}`);
  return res.data;
};

// ─── Rules ───────────────────────────────────────────────────────────────────

export const getRules = async () => {
  const res = await api.get(API_URLS.FINANCE_RULES);
  return res.data;
};

export const createRule = async (data) => {
  const res = await api.post(API_URLS.FINANCE_RULES, data);
  return res.data;
};

export const updateRule = async (id, data) => {
  const res = await api.put(`${API_URLS.FINANCE_RULES}/${id}`, data);
  return res.data;
};

export const deleteRule = async (id) => {
  const res = await api.delete(`${API_URLS.FINANCE_RULES}/${id}`);
  return res.data;
};

export const triggerRule = async (id) => {
  const res = await api.post(`${API_URLS.FINANCE_RULES}/${id}/trigger`, {});
  return res.data;
};

export const dryRunRule = async (id, amount) => {
  const res = await api.post(`${API_URLS.FINANCE_RULES}/${id}/dryrun`, { amount });
  return res.data;
};

export const reorderRules = async (order) => {
  const res = await api.put(API_URLS.FINANCE_RULES_REORDER, { order });
  return res.data;
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const getTransactions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.accountId) query.set('accountId', params.accountId);
  if (params.type) query.set('type', params.type);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.amountMin) query.set('amountMin', params.amountMin);
  if (params.amountMax) query.set('amountMax', params.amountMax);
  if (params.ruleId) query.set('ruleId', params.ruleId);
  const url = query.toString() ? `${API_URLS.FINANCE_TRANSACTIONS}?${query}` : API_URLS.FINANCE_TRANSACTIONS;
  const res = await api.get(url);
  return res.data;
};

export const createTransaction = async (data) => {
  const res = await api.post(API_URLS.FINANCE_TRANSACTIONS, data);
  return res.data;
};

export const updateTransactionStatus = async (id, status) => {
  const res = await api.put(`${API_URLS.FINANCE_TRANSACTIONS}/${id}/status`, { status });
  return res.data;
};

export const deleteTransaction = async (id) => {
  const res = await api.delete(`${API_URLS.FINANCE_TRANSACTIONS}/${id}`);
  return res.data;
};

export const bulkCreateTransactions = async (transactions) => {
  const res = await api.post(API_URLS.FINANCE_TRANSACTIONS_BULK, { transactions });
  return res.data;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = async (days = 90) => {
  const res = await api.get(`${API_URLS.FINANCE_ANALYTICS}?days=${days}`);
  return res.data;
};

export const getNetWorthHistory = async (days = 90) => {
  const res = await api.get(`${API_URLS.FINANCE_ANALYTICS_NET_WORTH}?days=${days}`);
  return res.data;
};

// ─── Budgets ─────────────────────────────────────────────────────────────────

export const getBudgets = async (month) => {
  const url = month ? `${API_URLS.FINANCE_BUDGETS}?month=${month}` : API_URLS.FINANCE_BUDGETS;
  const res = await api.get(url);
  return res.data;
};

export const createBudget = async (data) => {
  const res = await api.post(API_URLS.FINANCE_BUDGETS, data);
  return res.data;
};

export const updateBudget = async (id, data) => {
  const res = await api.put(`${API_URLS.FINANCE_BUDGETS}/${id}`, data);
  return res.data;
};

export const upsertBudget = async (data) => {
  const res = await api.put(API_URLS.FINANCE_BUDGETS, data);
  return res.data;
};

export const deleteBudget = async (id) => {
  const res = await api.delete(`${API_URLS.FINANCE_BUDGETS}/${id}`);
  return res.data;
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const updateFinanceSettings = async (data) => {
  const res = await api.put(API_URLS.FINANCE_SETTINGS, data);
  return res.data;
};
