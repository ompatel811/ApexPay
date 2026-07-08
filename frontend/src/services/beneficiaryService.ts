import { api } from './api';

export interface Beneficiary {
  id: string;
  nickname: string;
  upiId: string;
  mobileNumber: string;
  fullName: string;
  walletNumber: string;
  recipientUserId: string;
}

export interface PlatformUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
  profilePhoto: string | null;
  dateOfBirth: string | null;
  accountStatus: string;
  roles: string[];
}

export interface AddBeneficiaryPayload {
  recipientIdentifier: string;
  nickname?: string;
}

export const beneficiaryService = {
  addBeneficiary: async (payload: AddBeneficiaryPayload): Promise<Beneficiary> => {
    const response = await api.post('/api/beneficiaries', payload);
    return response.data.data;
  },

  getBeneficiaries: async (): Promise<Beneficiary[]> => {
    const response = await api.get('/api/beneficiaries');
    return response.data.data;
  },

  searchPlatformUsers: async (query: string): Promise<PlatformUser[]> => {
    const response = await api.get(`/api/beneficiaries/search?q=${query}`);
    return response.data.data;
  },
};
