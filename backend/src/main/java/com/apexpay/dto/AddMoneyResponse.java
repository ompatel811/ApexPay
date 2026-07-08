package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Receipt DTO returned after simulated Add Money transactions.
 */
public record AddMoneyResponse(
        String transactionReference,
        BigDecimal amount,
        BigDecimal balanceAfter,
        LocalDateTime timestamp,
        String status,
        String remarks
) {}
