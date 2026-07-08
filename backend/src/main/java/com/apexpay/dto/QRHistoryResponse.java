package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing an entry in the user QR history.
 */
public record QRHistoryResponse(
        UUID id,
        String qrType,
        String referenceNumber,
        BigDecimal amount,
        String currency,
        LocalDateTime expirationDate,
        String status,
        LocalDateTime createdAt
) {}
