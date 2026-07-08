package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO representing scanned QR validation results.
 */
public record ScanQRResponse(
        UUID qrCodeId,
        String qrType,
        UUID recipientUserId,
        UUID recipientWalletId,
        String recipientName,
        String recipientUsername,
        String recipientWalletNumber,
        BigDecimal amount,
        String currency,
        String remarks,
        String referenceNumber,
        boolean valid,
        String message,
        boolean signatureValid
) {}
