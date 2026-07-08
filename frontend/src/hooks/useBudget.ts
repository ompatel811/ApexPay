import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService, Budget, FinancialGoal } from '@/services/budgetService';

export const useBudget = () => {
  const queryClient = useQueryClient();

  const useBudgetsQuery = (month?: string) => {
    return useQuery({
      queryKey: ['budgets', month],
      queryFn: () => budgetService.getBudgets(month),
    });
  };

  const useCreateBudgetMutation = () => {
    return useMutation({
      mutationFn: (payload: { category: string; amountLimit: number; month: string }) =>
        budgetService.createBudget(payload),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['budgets', variables.month] });
      },
    });
  };

  const useUpdateBudgetMutation = () => {
    return useMutation({
      mutationFn: ({ id, category, amountLimit, month }: { id: string; category: string; amountLimit: number; month: string }) =>
        budgetService.updateBudget(id, { category, amountLimit, month }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['budgets', variables.month] });
      },
    });
  };

  const useDeleteBudgetMutation = () => {
    return useMutation({
      mutationFn: ({ id, month }: { id: string; month: string }) => budgetService.deleteBudget(id),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['budgets', variables.month] });
      },
    });
  };

  const useGoalsQuery = () => {
    return useQuery({
      queryKey: ['financialGoals'],
      queryFn: budgetService.getGoals,
    });
  };

  const useCreateGoalMutation = () => {
    return useMutation({
      mutationFn: (payload: { name: string; targetAmount: number; currentAmount: number; targetDate: string }) =>
        budgetService.createGoal(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
      },
    });
  };

  const useUpdateGoalMutation = () => {
    return useMutation({
      mutationFn: ({ id, name, targetAmount, currentAmount, targetDate }: { id: string; name: string; targetAmount: number; currentAmount: number; targetDate: string }) =>
        budgetService.updateGoal(id, { name, targetAmount, currentAmount, targetDate }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
      },
    });
  };

  const useDeleteGoalMutation = () => {
    return useMutation({
      mutationFn: (id: string) => budgetService.deleteGoal(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
      },
    });
  };

  return {
    useBudgetsQuery,
    useCreateBudgetMutation,
    useUpdateBudgetMutation,
    useDeleteBudgetMutation,
    useGoalsQuery,
    useCreateGoalMutation,
    useUpdateGoalMutation,
    useDeleteGoalMutation,
  };
};
export default useBudget;
