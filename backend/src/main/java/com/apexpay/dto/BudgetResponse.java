package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BudgetResponse(
    UUID id,
    String category,
    BigDecimal amountLimit,
    BigDecimal spent,
    String month,
    LocalDateTime createdAt
) {}
