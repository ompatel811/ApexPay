import { api } from './api';

export interface LinkBankAccountPayload {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  accountType: 'SAVINGS' | 'CURRENT';
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifsc: string;
  branch: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isPrimary: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  createdAt: string;
}

export const bankService = {
  linkBankAccount: async (payload: LinkBankAccountPayload): Promise<BankAccount> => {
    const response = await api.post('/api/bank/link', payload);
    return response.data.data;
  },

  getBankAccounts: async (): Promise<BankAccount[]> => {
    const response = await api.get('/api/bank');
    return response.data.data;
  },

  setPrimaryBankAccount: async (id: string): Promise<BankAccount> => {
    const response = await api.put(`/api/bank/${id}/primary`);
    return response.data.data;
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    await api.delete(`/api/bank/${id}`);
  },
};
