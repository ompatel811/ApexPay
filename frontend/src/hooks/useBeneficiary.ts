import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { beneficiaryService, AddBeneficiaryPayload } from '@/services/beneficiaryService';

export function useBeneficiary() {
  const queryClient = useQueryClient();

  // 1. Add Beneficiary Mutation
  const addBeneficiaryMutation = useMutation({
    mutationFn: (payload: AddBeneficiaryPayload) => beneficiaryService.addBeneficiary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
  });

  return {
    addBeneficiary: addBeneficiaryMutation.mutate,
    addBeneficiaryAsync: addBeneficiaryMutation.mutateAsync,
    isAdding: addBeneficiaryMutation.isPending,
    addError: addBeneficiaryMutation.error,
    addResponse: addBeneficiaryMutation.data,
  };
}

// 2. Get Beneficiaries Query
export function useBeneficiariesQuery() {
  return useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => beneficiaryService.getBeneficiaries(),
  });
}

// 3. Search Platform Users Query
export function useSearchPlatformUsersQuery(searchQuery: string, enabled = false) {
  return useQuery({
    queryKey: ['platform-users-search', searchQuery],
    queryFn: () => beneficiaryService.searchPlatformUsers(searchQuery),
    enabled: searchQuery.trim().length >= 2 && enabled,
  });
}
