import api from './api';

export interface PaymentMessageResponse {
  id: string;
  conversationId: string;
  transactionId?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  referenceNumber: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface PaymentRequestResponse {
  id: string;
  conversationId: string;
  requesterId: string;
  requesterName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  reason?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface PaymentTimelineResponse {
  conversationId: string;
  paymentMessages: PaymentMessageResponse[];
  paymentRequests: PaymentRequestResponse[];
}

export const paymentChatService = {
  sendMoney: async (data: { conversationId: string; receiverId: string; amount: number; note?: string }): Promise<PaymentMessageResponse> => {
    const res = await api.post('/api/chat/payment/send', data);
    return res.data.data;
  },

  requestMoney: async (data: { conversationId: string; receiverId: string; amount: number; reason?: string }): Promise<PaymentRequestResponse> => {
    const res = await api.post('/api/chat/payment/request', data);
    return res.data.data;
  },

  acceptRequest: async (requestId: string): Promise<PaymentMessageResponse> => {
    const res = await api.post(`/api/chat/payment/accept/${requestId}`);
    return res.data.data;
  },

  rejectRequest: async (requestId: string): Promise<PaymentRequestResponse> => {
    const res = await api.post(`/api/chat/payment/reject/${requestId}`);
    return res.data.data;
  },

  cancelRequest: async (requestId: string): Promise<PaymentRequestResponse> => {
    const res = await api.post(`/api/chat/payment/cancel/${requestId}`);
    return res.data.data;
  },

  shareQR: async (data: { conversationId: string; receiverId: string; qrCodeContent: string }): Promise<any> => {
    const res = await api.post('/api/chat/payment/share-qr', data);
    return res.data.data;
  },

  shareReceipt: async (data: { conversationId: string; transactionId: string; receiverId: string }): Promise<any> => {
    const res = await api.post('/api/chat/payment/share-receipt', data);
    return res.data.data;
  },

  getTimeline: async (conversationId: string): Promise<PaymentTimelineResponse> => {
    const res = await api.get(`/api/chat/payment/history/${conversationId}`);
    return res.data.data;
  }
};
