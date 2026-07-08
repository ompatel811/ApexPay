package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * DTO representing a transfer/payment request.
 */
public record SendMoneyRequest(
        @NotBlank(message = "Recipient identifier (email, mobile number, or wallet number) is required")
        String recipientIdentifier,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0001", message = "Amount must be greater than zero")
        BigDecimal amount,

        String remarks,

        @NotBlank(message = "Idempotency key is required")
        String idempotencyKey
) {}
