package com.apexpay.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record FraudAlertResponse(
    UUID id,
    UUID transactionId,
    String transactionRef,
    BigDecimal amount,
    UUID userId,
    String username,
    UUID walletId,
    String walletNumber,
    UUID merchantId,
    String merchantBusinessName,
    int riskScore,
    String riskLevel,
    String reason,
    String action,
    String status,
    LocalDateTime createdAt
) {}
