package com.apexpay.dto;

import java.math.BigDecimal;

/**
 * DTO representing payment validation dry-run response.
 */
public record PaymentValidationResponse(
        boolean valid,
        String message,
        String senderWalletNumber,
        String senderName,
        String receiverWalletNumber,
        String receiverName,
        BigDecimal amount,
        BigDecimal dailyLimitRemaining,
        BigDecimal monthlyLimitRemaining
) {}
