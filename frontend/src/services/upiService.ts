import { api } from './api';
import { SendMoneyResponse } from './paymentService';

export interface CreateUpiPayload {
  upiHandle: string;
}

export interface UpiIdResponse {
  id: string;
  upiId: string;
  isPrimary: boolean;
  status: string;
  createdAt: string;
}

export interface UpiPayPayload {
  senderUpi: string;
  recipientUpi: string;
  amount: number;
  remarks?: string;
  idempotencyKey: string;
}

export interface RequestMoneyPayload {
  requesterUpi: string;
  payerUpi: string;
  amount: number;
  remarks?: string;
}

export interface UpiRequestResponse {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterUpi: string;
  payerId: string;
  payerName: string;
  payerUpi: string;
  amount: number;
  remarks: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export const upiService = {
  createUpiId: async (payload: CreateUpiPayload): Promise<UpiIdResponse> => {
    const response = await api.post('/api/upi/create', payload);
    return response.data.data;
  },

  getUpiIds: async (): Promise<UpiIdResponse[]> => {
    const response = await api.get('/api/upi');
    return response.data.data;
  },

  setDefaultUpi: async (id: string): Promise<UpiIdResponse> => {
    const response = await api.put(`/api/upi/default?upiId=${id}`);
    return response.data.data;
  },

  deleteUpiId: async (id: string): Promise<void> => {
    await api.delete(`/api/upi/${id}`);
  },

  checkAvailability: async (upiId: string): Promise<boolean> => {
    const response = await api.get(`/api/upi/check-availability?upiId=${encodeURIComponent(upiId)}`);
    return response.data.data;
  },

  payUsingUpi: async (payload: UpiPayPayload): Promise<SendMoneyResponse> => {
    const response = await api.post('/api/upi/pay', payload);
    return response.data.data;
  },

  requestMoney: async (payload: RequestMoneyPayload): Promise<UpiRequestResponse> => {
    const response = await api.post('/api/upi/request-money', payload);
    return response.data.data;
  },

  getRequests: async (): Promise<UpiRequestResponse[]> => {
    const response = await api.get('/api/upi/requests');
    return response.data.data;
  },

  acceptRequest: async (requestId: string, idempotencyKey: string): Promise<SendMoneyResponse> => {
    const response = await api.post(`/api/upi/request/${requestId}/accept?idempotencyKey=${idempotencyKey}`);
    return response.data.data;
  },

  rejectRequest: async (requestId: string): Promise<void> => {
    await api.post(`/api/upi/request/${requestId}/reject`);
  },
};
