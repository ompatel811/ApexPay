import axios from 'axios';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically append the Admin JWT Token
adminApi.interceptors.request.use(
  (config) => {
    const token = useAdminAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const adminService = {
  // Auth
  async login(request: any) {
    const response = await adminApi.post('/api/admin/auth/login', request);
    return response.data.data;
  },

  async getProfile() {
    const response = await adminApi.get('/api/admin/auth/me');
    return response.data.data;
  },

  // Dashboard
  async getDashboardData() {
    const response = await adminApi.get('/api/admin/dashboard');
    return response.data.data;
  },

  // System Health
  async getSystemHealth() {
    const response = await adminApi.get('/api/admin/system-health');
    return response.data.data;
  },

  async getSystemHealthHistory() {
    const response = await adminApi.get('/api/admin/system-health/history');
    return response.data.data;
  },

  // User Management
  async getUsers() {
    const response = await adminApi.get('/api/admin/users');
    return response.data.data;
  },

  async getUserDetails(id: string) {
    const response = await adminApi.get(`/api/admin/users/${id}`);
    return response.data.data;
  },

  async activateUser(id: string) {
    const response = await adminApi.put(`/api/admin/users/${id}/activate`);
    return response.data.data;
  },

  async suspendUser(id: string) {
    const response = await adminApi.put(`/api/admin/users/${id}/suspend`);
    return response.data.data;
  },

  async deleteUser(id: string) {
    const response = await adminApi.delete(`/api/admin/users/${id}`);
    return response.data.data;
  },

  async resetUserPassword(id: string, newPassword: string) {
    const response = await adminApi.put(`/api/admin/users/${id}/reset-password`, null, {
      params: { newPassword },
    });
    return response.data.data;
  },

  async getUserActivity(id: string) {
    const response = await adminApi.get(`/api/admin/users/${id}/activity`);
    return response.data.data;
  },

  // Merchant Management
  async getMerchants() {
    const response = await adminApi.get('/api/admin/merchants');
    return response.data.data;
  },

  async approveMerchant(id: string) {
    const response = await adminApi.put(`/api/admin/merchants/${id}/approve`);
    return response.data.data;
  },

  async rejectMerchant(id: string, reason: string) {
    const response = await adminApi.put(`/api/admin/merchants/${id}/reject`, null, {
      params: { reason },
    });
    return response.data.data;
  },

  async suspendMerchant(id: string) {
    const response = await adminApi.put(`/api/admin/merchants/${id}/suspend`);
    return response.data.data;
  },

  async deleteMerchant(id: string) {
    const response = await adminApi.delete(`/api/admin/merchants/${id}`);
    return response.data.data;
  },

  async getSettlements() {
    const response = await adminApi.get('/api/admin/merchants/settlements');
    return response.data.data;
  },

  // Wallet Management
  async getWallets() {
    const response = await adminApi.get('/api/admin/wallets');
    return response.data.data;
  },

  async freezeWallet(id: string) {
    const response = await adminApi.put(`/api/admin/wallets/${id}/freeze`);
    return response.data.data;
  },

  async unfreezeWallet(id: string) {
    const response = await adminApi.put(`/api/admin/wallets/${id}/unfreeze`);
    return response.data.data;
  },

  async adjustWalletBalance(id: string, amount: number, remarks: string) {
    const response = await adminApi.post(`/api/admin/wallets/${id}/adjust`, null, {
      params: { amount, remarks },
    });
    return response.data.data;
  },

  // Linked Banks
  async getLinkedBanks() {
    const response = await adminApi.get('/api/admin/banks');
    return response.data.data;
  },

  async approveBank(id: string) {
    const response = await adminApi.put(`/api/admin/banks/${id}/approve`);
    return response.data.data;
  },

  async rejectBank(id: string) {
    const response = await adminApi.put(`/api/admin/banks/${id}/reject`);
    return response.data.data;
  },

  // UPI IDs
  async getUpiIds() {
    const response = await adminApi.get('/api/admin/upi');
    return response.data.data;
  },

  async deactivateUpi(id: string) {
    const response = await adminApi.put(`/api/admin/upi/${id}/deactivate`);
    return response.data.data;
  },

  async activateUpi(id: string) {
    const response = await adminApi.put(`/api/admin/upi/${id}/activate`);
    return response.data.data;
  },

  async deleteUpi(id: string) {
    const response = await adminApi.delete(`/api/admin/upi/${id}`);
    return response.data.data;
  },

  // QRs
  async getQrCodes() {
    const response = await adminApi.get('/api/admin/qr');
    return response.data.data;
  },

  async deactivateQr(id: string) {
    const response = await adminApi.put(`/api/admin/qr/${id}/deactivate`);
    return response.data.data;
  },

  async deleteQr(id: string) {
    const response = await adminApi.delete(`/api/admin/qr/${id}`);
    return response.data.data;
  },

  async getQrUsage(id: string) {
    const response = await adminApi.get(`/api/admin/qr/${id}/usage`);
    return response.data.data;
  },

  // Settings
  async getSettings() {
    const response = await adminApi.get('/api/admin/settings');
    return response.data.data;
  },

  async updateSetting(key: string, value: string) {
    const response = await adminApi.put('/api/admin/settings', { key, value });
    return response.data.data;
  },

  // Audit Logs
  async getAuditLogs() {
    const response = await adminApi.get('/api/admin/audit-logs');
    return response.data.data;
  },

  // Notifications
  async sendNotification(request: { userId?: string | null; title: string; message: string; notificationType?: string; scheduledTime?: string }) {
    const response = await adminApi.post('/api/admin/notifications', request);
    return response.data.data;
  },

  // Transactions
  async getTransactions() {
    const response = await adminApi.get('/api/admin/transactions');
    return response.data.data;
  },

  async approveTransaction(id: string) {
    const response = await adminApi.put(`/api/admin/transactions/${id}/approve`);
    return response.data.data;
  },

  async reverseTransaction(id: string) {
    const response = await adminApi.put(`/api/admin/transactions/${id}/reverse`);
    return response.data.data;
  },

  async cancelTransaction(id: string) {
    const response = await adminApi.put(`/api/admin/transactions/${id}/cancel`);
    return response.data.data;
  },

  // Report Export File Download
  async downloadReport(format: string, type: string) {
    const response = await adminApi.get('/api/admin/reports', {
      params: { format, type },
      responseType: 'blob',
    });
    return response.data;
  },

  // Fraud Detection & Risk Engine
  async getFraudAlerts(): Promise<any[]> {
    const response = await adminApi.get('/api/fraud/alerts');
    return response.data.data;
  },

  async getHighRiskUsers() {
    const response = await adminApi.get('/api/fraud/high-risk');
    return response.data.data;
  },

  async reviewFraudAlert(request: { alertId: string; status: string; notes?: string }) {
    const response = await adminApi.post('/api/fraud/review', request);
    return response.data.data;
  },

  async blockEntity(request: { type: string; itemValue: string; reason?: string }) {
    const response = await adminApi.post('/api/fraud/block', request);
    return response.data.data;
  },

  async freezeEntity(type: string, id: string) {
    const response = await adminApi.post('/api/fraud/freeze', null, {
      params: { type, id }
    });
    return response.data.data;
  },

  async whitelistEntity(request: { type: string; itemValue: string; description?: string }) {
    const response = await adminApi.post('/api/fraud/whitelist', request);
    return response.data.data;
  },

  async getInvestigationDetails(id: string) {
    const response = await adminApi.get(`/api/fraud/investigation/${id}`);
    return response.data.data;
  },

  async updateInvestigationDetails(id: string, status: string, notes: string) {
    const response = await adminApi.put(`/api/fraud/investigation/${id}`, null, {
      params: { status, notes }
    });
    return response.data.data;
  },
};
