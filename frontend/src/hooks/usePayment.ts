import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService, SendMoneyPayload } from '@/services/paymentService';

export function usePayment() {
  const queryClient = useQueryClient();

  // 1. Send Money Mutation
  const sendMoneyMutation = useMutation({
    mutationFn: (payload: SendMoneyPayload) => paymentService.sendMoney(payload),
    onSuccess: () => {
      // Invalidate related caches to ensure totals/transactions refresh
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
    },
  });

  // 2. Validate Payment Dry-Run Mutation
  const validatePaymentMutation = useMutation({
    mutationFn: (payload: SendMoneyPayload) => paymentService.validatePayment(payload),
  });

  // 3. Cancel Payment Mutation
  const cancelPaymentMutation = useMutation({
    mutationFn: (transactionId: string) => paymentService.cancelPayment(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
    },
  });

  return {
    sendMoney: sendMoneyMutation.mutate,
    sendMoneyAsync: sendMoneyMutation.mutateAsync,
    isSending: sendMoneyMutation.isPending,
    sendError: sendMoneyMutation.error,
    sendResponse: sendMoneyMutation.data,

    validatePayment: validatePaymentMutation.mutate,
    validatePaymentAsync: validatePaymentMutation.mutateAsync,
    isValidating: validatePaymentMutation.isPending,
    validationError: validatePaymentMutation.error,
    validationResponse: validatePaymentMutation.data,

    cancelPayment: cancelPaymentMutation.mutate,
    isCancelling: cancelPaymentMutation.isPending,
  };
}

// 4. Get Transaction Details Query
export function useTransactionDetailsQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ['transaction-details', id],
    queryFn: () => paymentService.getTransactionDetails(id),
    enabled: !!id && enabled,
  });
}

// 5. Get Transaction History Query
export function useTransactionHistoryQuery(page = 0, size = 10) {
  return useQuery({
    queryKey: ['transactions-history', page, size],
    queryFn: () => paymentService.getTransactionHistory(page, size),
  });
}

// 6. Get Payment Receipt Query
export function useReceiptQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ['payment-receipt', id],
    queryFn: () => paymentService.getReceipt(id),
    enabled: !!id && enabled,
  });
}
