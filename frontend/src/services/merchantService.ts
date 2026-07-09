import { api } from './api';

export interface BusinessRegisterPayload {
  businessName: string;
  businessType: string;
  businessEmail: string;
  businessMobile: string;
  businessAddress: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface BusinessProfileUpdatePayload {
  businessName: string;
  businessEmail: string;
  businessMobile: string;
  businessAddress: string;
  businessLogo?: string;
}

export interface KycSubmitPayload {
  panUpload: string;
  gstUpload: string;
  businessProof: string;
  identityProof: string;
  addressProof: string;
}

export interface KycVerifySimulatePayload {
  status: 'APPROVED' | 'REJECTED';
  rejectedReason?: string;
}

export interface CreatePaymentLinkPayload {
  amount: number;
  currency: string;
  expiryHours: number;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
}

export interface PaymentLinkResponseData {
  id: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  expiry: string;
  description: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  payUrl: string;
  transactionId?: string;
  businessName: string;
  createdAt: string;
}

export interface CreateRefundPayload {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResponseData {
  id: string;
  transactionId: string;
  transactionReference: string;
  amount: number;
  reason: string;
  status: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface SettlementResponseData {
  id: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  settlementType: string;
  status: string;
  settledAt?: string;
  createdAt: string;
}

export interface InviteEmployeePayload {
  email: string;
  role: string;
}

export interface UpdateEmployeePayload {
  role: string;
  status: string;
}

export interface EmployeeResponseData {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface MerchantProfileResponseData {
  id: string;
  businessName: string;
  businessType: string;
  businessEmail: string;
  businessMobile: string;
  gstNumber?: string;
  panNumber?: string;
  ownerId: string;
  ownerName: string;
  businessAddress: string;
  businessLogo?: string;
  verificationStatus: string;
  rejectedReason?: string;
  approvedDate?: string;
  panUpload?: string;
  gstUpload?: string;
  businessProof?: string;
  identityProof?: string;
  addressProof?: string;
  walletNumber: string;
  walletBalance: number;
  walletCurrency: string;
  createdAt: string;
}

export interface MerchantDashboardResponseData {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalRevenue: number;
  totalRefunds: number;
  totalTransactionsCount: number;
  pendingPaymentsCount: number;
  settlementAmount: number;
  recentPayments: PaymentLinkResponseData[];
  verificationStatus: string;
}

export interface AnalyticsTrendItem {
  label: string;
  value: number;
}

export interface MerchantAnalyticsResponseData {
  revenueTrend: AnalyticsTrendItem[];
  customerTrend: AnalyticsTrendItem[];
  paymentSuccessRate: number;
  refundTrend: AnalyticsTrendItem[];
  averageOrderValue: number;
  monthlyRevenue: AnalyticsTrendItem[];
}

export const merchantService = {
  registerMerchant: async (payload: BusinessRegisterPayload): Promise<MerchantProfileResponseData> => {
    const response = await api.post('/api/merchant/register', payload);
    return response.data.data;
  },

  getProfile: async (): Promise<MerchantProfileResponseData> => {
    const response = await api.get('/api/merchant/profile');
    return response.data.data;
  },

  updateProfile: async (payload: BusinessProfileUpdatePayload): Promise<MerchantProfileResponseData> => {
    const response = await api.put('/api/merchant/profile', payload);
    return response.data.data;
  },

  submitKyc: async (payload: KycSubmitPayload): Promise<MerchantProfileResponseData> => {
    const response = await api.post('/api/merchant/kyc/submit', payload);
    return response.data.data;
  },

  simulateKyc: async (payload: KycVerifySimulatePayload): Promise<MerchantProfileResponseData> => {
    const response = await api.post('/api/merchant/kyc/verify-simulate', payload);
    return response.data.data;
  },

  createPaymentLink: async (payload: CreatePaymentLinkPayload): Promise<PaymentLinkResponseData> => {
    const response = await api.post('/api/merchant/payment-link', payload);
    return response.data.data;
  },

  getPaymentLinks: async (): Promise<PaymentLinkResponseData[]> => {
    const response = await api.get('/api/merchant/payment-links');
    return response.data.data;
  },

  createRefund: async (payload: CreateRefundPayload): Promise<RefundResponseData> => {
    const response = await api.post('/api/merchant/refund', payload);
    return response.data.data;
  },

  approveRefund: async (id: string): Promise<RefundResponseData> => {
    const response = await api.post(`/api/merchant/refund/${id}/approve`);
    return response.data.data;
  },

  rejectRefund: async (id: string, reason: string): Promise<RefundResponseData> => {
    const response = await api.post(`/api/merchant/refund/${id}/reject?reason=${encodeURIComponent(reason)}`);
    return response.data.data;
  },

  getRefunds: async (): Promise<RefundResponseData[]> => {
    const response = await api.get('/api/merchant/refunds');
    return response.data.data;
  },

  getDashboard: async (): Promise<MerchantDashboardResponseData> => {
    const response = await api.get('/api/merchant/dashboard');
    return response.data.data;
  },

  getAnalytics: async (): Promise<MerchantAnalyticsResponseData> => {
    const response = await api.get('/api/merchant/analytics');
    return response.data.data;
  },

  getSettlements: async (): Promise<SettlementResponseData[]> => {
    const response = await api.get('/api/merchant/settlements');
    return response.data.data;
  },

  triggerSettlement: async (): Promise<SettlementResponseData> => {
    const response = await api.post('/api/merchant/settlements/trigger');
    return response.data.data;
  },

  simulateSettlementsJob: async (): Promise<void> => {
    await api.post('/api/merchant/settlements/simulate-job');
  },

  inviteEmployee: async (payload: InviteEmployeePayload): Promise<EmployeeResponseData> => {
    const response = await api.post('/api/merchant/team/invite', payload);
    return response.data.data;
  },

  updateEmployee: async (id: string, payload: UpdateEmployeePayload): Promise<EmployeeResponseData> => {
    const response = await api.put(`/api/merchant/team/${id}`, payload);
    return response.data.data;
  },

  removeEmployee: async (id: string): Promise<void> => {
    await api.delete(`/api/merchant/team/${id}`);
  },

  getTeamMembers: async (): Promise<EmployeeResponseData[]> => {
    const response = await api.get('/api/merchant/team');
    return response.data.data;
  },

  // Public Gateway Operations
  getPublicInvoice: async (ref: string): Promise<PaymentLinkResponseData> => {
    const response = await api.get(`/api/public/payment-links/${ref}`);
    return response.data.data;
  },

  payPublicInvoice: async (ref: string, idempotencyKey: string): Promise<any> => {
    const response = await api.post(`/api/public/payment-links/${ref}/pay`, {}, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
    return response.data.data;
  }
};
