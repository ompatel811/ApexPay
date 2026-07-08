package com.apexpay.dto;

import java.math.BigDecimal;

/**
 * DTO representing wallet balance credits, debits, and statistics.
 */
public record WalletAnalyticsResponse(
        BigDecimal totalCredits,
        BigDecimal totalDebits,
        BigDecimal monthlyCredits,
        BigDecimal monthlyDebits,
        BigDecimal averageTransactionAmount,
        BigDecimal largestTransaction
) {}
