import { api } from './api';

export interface GenerateQRCodeRequest {
  qrType: 'PERSONAL' | 'DYNAMIC' | 'REQUEST';
  amount?: number;
  currency?: string;
  remarks?: string;
  expirationMinutes?: number;
}

export interface GenerateQRCodeResponse {
  id?: string;
  qrType: string;
  qrData: string;
  qrImageBase64: string;
  referenceNumber?: string;
  amount: number;
  currency: string;
  expirationDate?: string;
  status: string;
}

export interface ScanQRRequest {
  qrString?: string;
  qrImageBase64?: string;
}

export interface ScanQRResponse {
  qrCodeId?: string;
  qrType: string;
  recipientUserId: string;
  recipientWalletId: string;
  recipientName: string;
  recipientUsername: string;
  recipientWalletNumber: string;
  amount: number;
  currency: string;
  remarks?: string;
  referenceNumber?: string;
  valid: boolean;
  message: string;
  signatureValid: boolean;
}

export interface QRPaymentRequest {
  qrCodeId?: string;
  qrData: string;
  amount?: number; // only required if PERSONAL QR
  remarks?: string;
  idempotencyKey: string;
}

export interface QRPaymentResponse {
  referenceNumber: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  receiverName: string;
  timestamp: string;
  remarks?: string;
}

export interface QRHistoryResponse {
  id: string;
  qrType: string;
  referenceNumber?: string;
  amount: number;
  currency: string;
  expirationDate?: string;
  status: string;
  createdAt: string;
}

export const qrService = {
  generatePersonalQR: async (): Promise<GenerateQRCodeResponse> => {
    const response = await api.post('/api/qr/generate');
    return response.data.data;
  },

  generateDynamicQR: async (payload: GenerateQRCodeRequest): Promise<GenerateQRCodeResponse> => {
    const response = await api.post('/api/qr/generate-dynamic', payload);
    return response.data.data;
  },

  generateRequestQR: async (payload: GenerateQRCodeRequest): Promise<GenerateQRCodeResponse> => {
    const response = await api.post('/api/qr/request-money', payload);
    return response.data.data;
  },

  scanQR: async (payload: ScanQRRequest): Promise<ScanQRResponse> => {
    const response = await api.post('/api/qr/scan', payload);
    return response.data.data;
  },

  payQR: async (payload: QRPaymentRequest): Promise<QRPaymentResponse> => {
    const response = await api.post('/api/qr/pay', payload);
    return response.data.data;
  },

  getHistory: async (): Promise<QRHistoryResponse[]> => {
    const response = await api.get('/api/qr/history');
    return response.data.data;
  },

  getDetails: async (id: string): Promise<any> => {
    const response = await api.get(`/api/qr/${id}`);
    return response.data.data;
  },

  revokeQR: async (id: string): Promise<void> => {
    await api.delete(`/api/qr/${id}`);
  },
};
