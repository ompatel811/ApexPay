import { api } from './api';

export interface SendMoneyPayload {
  recipientIdentifier: string;
  amount: number;
  remarks?: string;
  idempotencyKey: string;
}

export interface SendMoneyResponse {
  referenceNumber: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  senderWalletNumber: string;
  receiverWalletNumber: string;
  createdAt: string;
  remarks: string;
}

export interface PaymentValidationResponse {
  valid: boolean;
  message: string;
  senderWalletNumber: string;
  senderName: string;
  receiverWalletNumber: string;
  receiverName: string;
  amount: number;
  dailyLimitRemaining: number;
  monthlyLimitRemaining: number;
}

export interface PaymentReceiptResponse {
  referenceNumber: string;
  transactionId: string;
  senderName: string;
  senderWalletNumber: string;
  receiverName: string;
  receiverWalletNumber: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  remarks: string;
}

export interface TransactionDetails {
  id: string;
  referenceNumber: string;
  senderWalletNumber: string;
  senderName: string;
  receiverWalletNumber: string;
  receiverName: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionHistory {
  transactions: TransactionDetails[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export const paymentService = {
  sendMoney: async (payload: SendMoneyPayload): Promise<SendMoneyResponse> => {
    const response = await api.post('/api/payments/send', payload);
    return response.data.data;
  },

  validatePayment: async (payload: SendMoneyPayload): Promise<PaymentValidationResponse> => {
    const response = await api.post('/api/payments/validate', payload);
    return response.data.data;
  },

  getTransactionDetails: async (id: string): Promise<TransactionDetails> => {
    const response = await api.get(`/api/payments/${id}`);
    return response.data.data;
  },

  getTransactionHistory: async (page = 0, size = 10): Promise<TransactionHistory> => {
    const response = await api.get(`/api/payments/history?page=${page}&size=${size}`);
    return response.data.data;
  },

  getReceipt: async (id: string): Promise<PaymentReceiptResponse> => {
    const response = await api.get(`/api/payments/receipt/${id}`);
    return response.data.data;
  },

  cancelPayment: async (transactionId: string): Promise<void> => {
    await api.post(`/api/payments/cancel?transactionId=${transactionId}`);
  },
};
