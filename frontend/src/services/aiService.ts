import { api as axiosClient } from './api';

export interface ChatMessage {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  message: string;
  createdAt: string;
}

export interface FinancialInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface BudgetRecommendation {
  id: string;
  category: string;
  recommendedAmount: number;
  currentSpending: number;
  reasoning: string;
  isApplied: boolean;
}

export interface FinancialHealthScore {
  id: string;
  score: number;
  savingsRate: number;
  budgetAdherence: number;
  billPaymentHistory: string;
  factorBreakdown: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  highestSpendingDay: string;
  mostFrequentMerchant: string;
  mostUsedPaymentMethod: string;
  categoryBreakdown: Record<string, number>;
}

export const aiService = {
  chat: async (message: string): Promise<{ response: string; timestamp: string }> => {
    const response = await axiosClient.post('/api/ai/chat', { message });
    return response.data.data;
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    const response = await axiosClient.get('/api/ai/chat/history');
    return response.data.data;
  },

  getInsights: async (): Promise<FinancialInsight[]> => {
    const response = await axiosClient.get('/api/ai/insights');
    return response.data.data;
  },

  getSummary: async (): Promise<FinancialSummary> => {
    const response = await axiosClient.get('/api/ai/summary');
    return response.data.data;
  },

  getBudgetRecommendations: async (): Promise<BudgetRecommendation[]> => {
    const response = await axiosClient.get('/api/ai/budget');
    return response.data.data;
  },

  applyBudgetRecommendation: async (id: string): Promise<BudgetRecommendation> => {
    const response = await axiosClient.post(`/api/ai/budget/${id}/apply`);
    return response.data.data;
  },

  getHealthScore: async (): Promise<FinancialHealthScore> => {
    const response = await axiosClient.get('/api/ai/health-score');
    return response.data.data;
  }
};

export default aiService;
