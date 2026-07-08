package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing successful execution details for QR payment.
 */
public record QRPaymentResponse(
        String referenceNumber,
        UUID transactionId,
        String status,
        BigDecimal amount,
        String currency,
        String receiverName,
        LocalDateTime timestamp,
        String remarks
) {}
