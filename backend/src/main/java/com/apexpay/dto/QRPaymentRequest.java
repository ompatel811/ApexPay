package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

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
