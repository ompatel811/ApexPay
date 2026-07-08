package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Request DTO for simulated Add Money transactions.
 */
public record AddMoneyRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Minimum amount to add is $0.01")
        BigDecimal amount,

        String fundingSource
) {}
