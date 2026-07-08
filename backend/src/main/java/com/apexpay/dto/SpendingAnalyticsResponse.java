package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.List;

public record SpendingAnalyticsResponse(
    BigDecimal dailySpending,
    BigDecimal weeklySpending,
    BigDecimal monthlySpending,
    BigDecimal yearlySpending,
    BigDecimal averageSpending,
    BigDecimal highestSpending,
    BigDecimal lowestSpending,
    List<CategorySpendingItem> categorySpending
) {}
