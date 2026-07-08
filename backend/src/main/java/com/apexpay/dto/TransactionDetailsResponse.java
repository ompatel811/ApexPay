package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing detailed transaction metadata.
 */
public record TransactionDetailsResponse(
        UUID id,
        String referenceNumber,
        String senderWalletNumber,
        String senderName,
        String receiverWalletNumber,
        String receiverName,
        BigDecimal amount,
        String currency,
        String status,
        String type,
        String remarks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
