import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface WalletDetails {
  id: string;
  walletNumber: string;
  availableBalance: number;
  currency: string;
  walletStatus: string;
  dailyTransferLimit: number;
  dailyWithdrawalLimit: number;
  monthlyTransferLimit: number;
  monthlyWithdrawalLimit: number;
  createdDate: string;
}

export interface WalletBalance {
  availableBalance: number;
  currency: string;
}

export interface WalletSummary {
  monthlyCredits: number;
  monthlyDebits: number;
  dailySpentToday: number;
  monthlySpentThisMonth: number;
}

export interface LedgerEntry {
  id: string;
  referenceNumber: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  remarks: string;
  status: string;
}

export interface WalletAnalytics {
  totalCredits: number;
  totalDebits: number;
  monthlyCredits: number;
  monthlyDebits: number;
  averageTransactionAmount: number;
  largestTransaction: number;
}

export interface AddMoneyPayload {
  amount: number;
  fundingSource: string;
}

export interface WithdrawPayload {
  amount: number;
}

export function useWallet() {
  const queryClient = useQueryClient();

  // 1. Add Money Mutation
  const addMoneyMutation = useMutation({
    mutationFn: async (payload: AddMoneyPayload) => {
      const response = await api.post('/api/wallet/add-money', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all query states relating to wallet
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-analytics'] });
    },
  });

  // 2. Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async (payload: WithdrawPayload) => {
      const response = await api.post('/api/wallet/withdraw', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-analytics'] });
    },
  });

  return {
    addMoney: addMoneyMutation.mutate,
    isAddingMoney: addMoneyMutation.isPending,
    addMoneyError: addMoneyMutation.error,
    addMoneyResponse: addMoneyMutation.data,

    withdraw: withdrawMutation.mutate,
    isWithdrawing: withdrawMutation.isPending,
    withdrawError: withdrawMutation.error,
    withdrawResponse: withdrawMutation.data,
  };
}

// 3. Get Wallet Query
export function useWalletQuery() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async (): Promise<WalletDetails> => {
      const response = await api.get('/api/wallet');
      return response.data.data;
    },
  });
}

// 4. Get Wallet Balance Query
export function useWalletBalanceQuery() {
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async (): Promise<WalletBalance> => {
      const response = await api.get('/api/wallet/balance');
      return response.data.data;
    },
  });
}

// 5. Get Wallet Summary Query
export function useWalletSummaryQuery() {
  return useQuery({
    queryKey: ['wallet-summary'],
    queryFn: async (): Promise<WalletSummary> => {
      const response = await api.get('/api/wallet/summary');
      return response.data.data;
    },
  });
}

// 6. Get Ledger Query
export function useLedgerQuery() {
  return useQuery({
    queryKey: ['wallet-ledger'],
    queryFn: async (): Promise<LedgerEntry[]> => {
      const response = await api.get('/api/wallet/ledger');
      return response.data.data;
    },
  });
}

// 7. Get Analytics Query
export function useWalletAnalyticsQuery() {
  return useQuery({
    queryKey: ['wallet-analytics'],
    queryFn: async (): Promise<WalletAnalytics> => {
      const response = await api.get('/api/wallet/analytics');
      return response.data.data;
    },
  });
}
