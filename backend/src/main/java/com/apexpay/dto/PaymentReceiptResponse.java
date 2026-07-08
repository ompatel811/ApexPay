package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing transaction receipt details.
 */
public record PaymentReceiptResponse(
        String referenceNumber,
        UUID transactionId,
        String senderName,
        String senderWalletNumber,
        String receiverName,
        String receiverWalletNumber,
        BigDecimal amount,
        String currency,
        String status,
        LocalDateTime timestamp,
        String remarks
) {}
