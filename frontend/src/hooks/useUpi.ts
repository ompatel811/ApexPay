import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upiService, CreateUpiPayload, UpiPayPayload, RequestMoneyPayload } from '@/services/upiService';

export const useUpi = () => {
  const queryClient = useQueryClient();

  const useUpiIdsQuery = () => {
    return useQuery({
      queryKey: ['upiIds'],
      queryFn: upiService.getUpiIds,
    });
  };

  const useCreateUpiMutation = () => {
    return useMutation({
      mutationFn: (payload: CreateUpiPayload) => upiService.createUpiId(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['upiIds'] });
      },
    });
  };

  const useSetDefaultUpiMutation = () => {
    return useMutation({
      mutationFn: (id: string) => upiService.setDefaultUpi(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['upiIds'] });
      },
    });
  };

  const useDeleteUpiMutation = () => {
    return useMutation({
      mutationFn: (id: string) => upiService.deleteUpiId(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['upiIds'] });
      },
    });
  };

  const useUpiRequestsQuery = () => {
    return useQuery({
      queryKey: ['upiRequests'],
      queryFn: upiService.getRequests,
    });
  };

  const usePayUsingUpiMutation = () => {
    return useMutation({
      mutationFn: (payload: UpiPayPayload) => upiService.payUsingUpi(payload),
    });
  };

  const useRequestMoneyMutation = () => {
    return useMutation({
      mutationFn: (payload: RequestMoneyPayload) => upiService.requestMoney(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['upiRequests'] });
      },
    });
  };

  const useAcceptRequestMutation = () => {
    return useMutation({
      mutationFn: ({ requestId, idempotencyKey }: { requestId: string; idempotencyKey: string }) =>
        upiService.acceptRequest(requestId, idempotencyKey),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['upiRequests'] });
      },
    });
  };

  const useRejectRequestMutation = () => {
    return useMutation({
      mutationFn: (requestId: string) => upiService.rejectRequest(requestId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['upiRequests'] });
      },
    });
  };

  return {
    useUpiIdsQuery,
    useCreateUpiMutation,
    useSetDefaultUpiMutation,
    useDeleteUpiMutation,
    useUpiRequestsQuery,
    usePayUsingUpiMutation,
    useRequestMoneyMutation,
    useAcceptRequestMutation,
    useRejectRequestMutation,
  };
};
