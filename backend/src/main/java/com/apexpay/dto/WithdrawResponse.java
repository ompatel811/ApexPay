package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Receipt DTO returned after simulated Wallet Withdrawals.
 */
public record WithdrawResponse(
        String transactionReference,
        BigDecimal amount,
        BigDecimal balanceAfter,
        LocalDateTime timestamp,
        String status,
        String remarks
) {}
