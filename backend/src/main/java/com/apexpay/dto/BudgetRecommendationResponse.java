package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetRecommendationResponse(
    UUID id,
    String category,
    BigDecimal recommendedAmount,
    BigDecimal currentSpending,
    String reasoning,
    boolean isApplied
) {}
