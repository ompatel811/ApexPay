package com.apexpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RequestMoneyRequest(
    @NotBlank(message = "Requester UPI ID is required")
    String requesterUpi,
    
    @NotBlank(message = "Payer UPI ID is required")
    String payerUpi,
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    BigDecimal amount,
    
    String remarks
) {}
