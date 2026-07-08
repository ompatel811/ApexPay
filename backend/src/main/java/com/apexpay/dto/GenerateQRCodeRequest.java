package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

/**
 * DTO representing request to generate a QR Code.
 */
public record GenerateQRCodeRequest(
        @NotBlank(message = "QR type is required")
        String qrType, // PERSONAL, DYNAMIC, REQUEST

        BigDecimal amount,

        String currency,

        String remarks,

        Integer expirationMinutes
) {}
