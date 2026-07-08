package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a transfer/payment response.
 */
public record SendMoneyResponse(
        String referenceNumber,
        UUID transactionId,
        String status,
        BigDecimal amount,
        String currency,
        String senderWalletNumber,
        String receiverWalletNumber,
        LocalDateTime createdAt,
        String remarks
) {}
