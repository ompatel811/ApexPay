package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpiPayRequest(
    @NotBlank(message = "Sender UPI ID is required")
    String senderUpi,
    
    @NotBlank(message = "Recipient UPI ID is required")
    String recipientUpi,
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    BigDecimal amount,
    
    String remarks,
    
    @NotBlank(message = "Idempotency key is required")
    String idempotencyKey
) {}
