package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO representing QR payment execution request.
 */
public record QRPaymentRequest(
        UUID qrCodeId,

        @NotBlank(message = "QR data is required")
        String qrData, // Raw JSON with signature

        BigDecimal amount, // Required if PERSONAL QR

        String remarks,

        @NotBlank(message = "Idempotency key is required")
        String idempotencyKey
) {}
