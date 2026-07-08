import { api as axiosClient } from './api';

export interface AnalyticsDashboard {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  totalTransactions: number;
  averageTransaction: number;
  highestExpense: number;
  highestIncome: number;
  pendingPayments: number;
}

export interface CategorySpendingItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface SpendingAnalytics {
  dailySpending: number;
  weeklySpending: number;
  monthlySpending: number;
  yearlySpending: number;
  averageSpending: number;
  highestSpending: number;
  lowestSpending: number;
  categorySpending: CategorySpendingItem[];
}

export interface IncomeSourceItem {
  source: string;
  amount: number;
  percentage: number;
}

export interface IncomeAnalytics {
  dailyIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  yearlyIncome: number;
  averageIncome: number;
  largestIncome: number;
  incomeSources: IncomeSourceItem[];
}

export interface TrendItem {
  label: string;
  credits: number;
  debits: number;
}

export interface TrendsResponse {
  trends: TrendItem[];
}

export const analyticsService = {
  getDashboardMetrics: async (): Promise<AnalyticsDashboard> => {
    const response = await axiosClient.get('/api/analytics/dashboard');
    return response.data.data;
  },

  getSpendingAnalytics: async (): Promise<SpendingAnalytics> => {
    const response = await axiosClient.get('/api/analytics/spending');
    return response.data.data;
  },

  getIncomeAnalytics: async (): Promise<IncomeAnalytics> => {
    const response = await axiosClient.get('/api/analytics/income');
    return response.data.data;
  },

  getTrends: async (period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Promise<TrendsResponse> => {
    const response = await axiosClient.get(`/api/analytics/trends?period=${period}`);
    return response.data.data;
  },

  updateTransactionCategory: async (transactionId: string, category: string): Promise<any> => {
    const response = await axiosClient.put(`/api/analytics/transaction/${transactionId}/category`, { category });
    return response.data.data;
  }
};
export default analyticsService;
