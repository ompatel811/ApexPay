import axiosClient from './axiosClient';

export interface Budget {
  id: string;
  category: string;
  amountLimit: number;
  spent: number;
  month: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentageProgress: number;
  targetDate: string;
  status: string;
  estimatedCompletionText: string;
  createdAt: string;
}

export const budgetService = {
  getBudgets: async (month?: string): Promise<Budget[]> => {
    const response = await axiosClient.get('/api/budget', { params: { month } });
    return response.data.data;
  },

  createBudget: async (data: { category: string; amountLimit: number; month: string }): Promise<Budget> => {
    const response = await axiosClient.post('/api/budget', data);
    return response.data.data;
  },

  updateBudget: async (id: string, data: { amountLimit: number; category: string; month: string }): Promise<Budget> => {
    const response = await axiosClient.put(`/api/budget/${id}`, data);
    return response.data.data;
  },

  deleteBudget: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/budget/${id}`);
  },

  getGoals: async (): Promise<FinancialGoal[]> => {
    const response = await axiosClient.get('/api/budget/goal');
    return response.data.data;
  },

  createGoal: async (data: { name: string; targetAmount: number; currentAmount: number; targetDate: string }): Promise<FinancialGoal> => {
    const response = await axiosClient.post('/api/budget/goal', data);
    return response.data.data;
  },

  updateGoal: async (id: string, data: { name: string; targetAmount: number; currentAmount: number; targetDate: string }): Promise<FinancialGoal> => {
    const response = await axiosClient.put(`/api/budget/goal/${id}`, data);
    return response.data.data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/budget/goal/${id}`);
  }
};
export default budgetService;
