import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService, LinkBankAccountPayload } from '@/services/bankService';

export const useBankAccount = () => {
  const queryClient = useQueryClient();

  const useBankAccountsQuery = () => {
    return useQuery({
      queryKey: ['bankAccounts'],
      queryFn: bankService.getBankAccounts,
    });
  };

  const useLinkBankAccountMutation = () => {
    return useMutation({
      mutationFn: (payload: LinkBankAccountPayload) => bankService.linkBankAccount(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      },
    });
  };

  const useSetPrimaryBankAccountMutation = () => {
    return useMutation({
      mutationFn: (id: string) => bankService.setPrimaryBankAccount(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      },
    });
  };

  const useDeleteBankAccountMutation = () => {
    return useMutation({
      mutationFn: (id: string) => bankService.deleteBankAccount(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      },
    });
  };

  return {
    useBankAccountsQuery,
    useLinkBankAccountMutation,
    useSetPrimaryBankAccountMutation,
    useDeleteBankAccountMutation,
  };
};
