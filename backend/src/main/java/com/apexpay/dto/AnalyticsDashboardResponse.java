package com.apexpay.dto;

import java.math.BigDecimal;

public record AnalyticsDashboardResponse(
    BigDecimal currentBalance,
    BigDecimal monthlyIncome,
    BigDecimal monthlyExpense,
    long totalTransactions,
    BigDecimal averageTransaction,
    BigDecimal highestExpense,
    BigDecimal highestIncome,
    long pendingPayments
) {}
