package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record FinancialGoalResponse(
    UUID id,
    String name,
    BigDecimal targetAmount,
    BigDecimal currentAmount,
    BigDecimal percentageProgress,
    LocalDate targetDate,
    String status,
    String estimatedCompletionText,
    LocalDateTime createdAt
) {}
