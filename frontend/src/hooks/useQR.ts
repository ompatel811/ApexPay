import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qrService, GenerateQRCodeRequest, QRPaymentRequest, ScanQRRequest } from '@/services/qrService';

export function useQR() {
  const queryClient = useQueryClient();

  // 1. Generate Personal QR Query
  const usePersonalQRQuery = () => {
    return useQuery({
      queryKey: ['personal-qr'],
      queryFn: () => qrService.generatePersonalQR(),
      staleTime: Infinity, // Personal QR is static, no need to refetch frequently
    });
  };

  // 2. Generate Dynamic QR Mutation
  const generateDynamicQRMutation = useMutation({
    mutationFn: (payload: GenerateQRCodeRequest) => qrService.generateDynamicQR(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });

  // 3. Generate Request QR Mutation
  const generateRequestQRMutation = useMutation({
    mutationFn: (payload: GenerateQRCodeRequest) => qrService.generateRequestQR(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });

  // 4. Scan QR Mutation
  const scanQRMutation = useMutation({
    mutationFn: (payload: ScanQRRequest) => qrService.scanQR(payload),
  });

  // 5. Pay QR Mutation
  const payQRMutation = useMutation({
    mutationFn: (payload: QRPaymentRequest) => qrService.payQR(payload),
    onSuccess: () => {
      // Invalidate caches to refresh balances and transaction history
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });

  // 6. Revoke/Cancel QR Mutation
  const revokeQRMutation = useMutation({
    mutationFn: (id: string) => qrService.revokeQR(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });

  return {
    usePersonalQRQuery,
    
    generateDynamicQR: generateDynamicQRMutation.mutate,
    generateDynamicQRAsync: generateDynamicQRMutation.mutateAsync,
    isGeneratingDynamic: generateDynamicQRMutation.isPending,
    dynamicQRResponse: generateDynamicQRMutation.data,

    generateRequestQR: generateRequestQRMutation.mutate,
    generateRequestQRAsync: generateRequestQRMutation.mutateAsync,
    isGeneratingRequest: generateRequestQRMutation.isPending,
    requestQRResponse: generateRequestQRMutation.data,

    scanQR: scanQRMutation.mutate,
    scanQRAsync: scanQRMutation.mutateAsync,
    isScanning: scanQRMutation.isPending,
    scanResponse: scanQRMutation.data,

    payQR: payQRMutation.mutate,
    payQRAsync: payQRMutation.mutateAsync,
    isPaying: payQRMutation.isPending,
    payResponse: payQRMutation.data,

    revokeQR: revokeQRMutation.mutate,
    isRevoking: revokeQRMutation.isPending,
  };
}

// 7. Get QR History Query
export function useQRHistoryQuery() {
  return useQuery({
    queryKey: ['qr-history'],
    queryFn: () => qrService.getHistory(),
  });
}
