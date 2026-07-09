package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePaymentLinkRequest(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
    BigDecimal amount,

    @NotBlank(message = "Currency is required")
    String currency,

    @NotNull(message = "Expiry hours is required")
    Integer expiryHours,

    String description,
    String customerName,
    String customerEmail,
    String customerMobile
) {}
