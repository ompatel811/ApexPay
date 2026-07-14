package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record FinancialHealthResponse(
    UUID id,
    int score,
    BigDecimal savingsRate,
    BigDecimal budgetAdherence,
    String billPaymentHistory,
    String factorBreakdown,
    LocalDateTime updatedAt
) {}
