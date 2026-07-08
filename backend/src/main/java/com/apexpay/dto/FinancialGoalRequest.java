package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialGoalRequest(
    @NotBlank(message = "Goal name is required")
    String name,

    @NotNull(message = "Target amount is required")
    @DecimalMin(value = "0.01", message = "Target amount must be positive")
    BigDecimal targetAmount,

    @NotNull(message = "Current progress amount is required")
    BigDecimal currentAmount,

    @NotNull(message = "Target date is required")
    @Future(message = "Target date must be in the future")
    LocalDate targetDate
) {}
