import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';

export const useAnalytics = () => {
  const queryClient = useQueryClient();

  const useDashboardQuery = () => {
    return useQuery({
      queryKey: ['analyticsDashboard'],
      queryFn: analyticsService.getDashboardMetrics,
      refetchInterval: 10000 // auto-refresh dashboard stats every 10 seconds for real-time live feel
    });
  };

  const useSpendingQuery = () => {
    return useQuery({
      queryKey: ['analyticsSpending'],
      queryFn: analyticsService.getSpendingAnalytics
    });
  };

  const useIncomeQuery = () => {
    return useQuery({
      queryKey: ['analyticsIncome'],
      queryFn: analyticsService.getIncomeAnalytics
    });
  };

  const useTrendsQuery = (period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    return useQuery({
      queryKey: ['analyticsTrends', period],
      queryFn: () => analyticsService.getTrends(period)
    });
  };

  const useUpdateCategoryMutation = () => {
    return useMutation({
      mutationFn: ({ transactionId, category }: { transactionId: string; category: string }) =>
        analyticsService.updateTransactionCategory(transactionId, category),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['analyticsDashboard'] });
        queryClient.invalidateQueries({ queryKey: ['analyticsSpending'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }
    });
  };

  return {
    useDashboardQuery,
    useSpendingQuery,
    useIncomeQuery,
    useTrendsQuery,
    useUpdateCategoryMutation
  };
};
export default useAnalytics;
