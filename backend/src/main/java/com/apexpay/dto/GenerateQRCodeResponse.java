package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing generated QR Code details, including Base64 image payload.
 */
public record GenerateQRCodeResponse(
        UUID id,
        String qrType,
        String qrData,
        String qrImageBase64, // PNG Base64 encoded string
        String referenceNumber,
        BigDecimal amount,
        String currency,
        LocalDateTime expirationDate,
        String status
) {}
