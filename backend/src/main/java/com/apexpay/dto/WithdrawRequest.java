package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Request DTO for simulated Wallet Withdrawals.
 */
public record WithdrawRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Minimum amount to withdraw is $0.01")
        BigDecimal amount
) {}
