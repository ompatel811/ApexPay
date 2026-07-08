package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.List;

public record IncomeAnalyticsResponse(
    BigDecimal dailyIncome,
    BigDecimal weeklyIncome,
    BigDecimal monthlyIncome,
    BigDecimal yearlyIncome,
    BigDecimal averageIncome,
    BigDecimal largestIncome,
    List<IncomeSourceItem> incomeSources
) {}
