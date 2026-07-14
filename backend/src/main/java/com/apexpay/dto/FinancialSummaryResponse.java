package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.Map;

public record FinancialSummaryResponse(
    BigDecimal totalIncome,
    BigDecimal totalExpenses,
    BigDecimal netSavings,
    BigDecimal savingsRate,
    String highestSpendingDay,
    String mostFrequentMerchant,
    String mostUsedPaymentMethod,
    Map<String, BigDecimal> categoryBreakdown
) {}
