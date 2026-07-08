package com.apexpay.dto;

import java.math.BigDecimal;

/**
 * DTO representing wallet credit/debit and limits summary.
 */
public record WalletSummaryResponse(
        BigDecimal monthlyCredits,
        BigDecimal monthlyDebits,
        BigDecimal dailySpentToday,
        BigDecimal monthlySpentThisMonth
) {}
