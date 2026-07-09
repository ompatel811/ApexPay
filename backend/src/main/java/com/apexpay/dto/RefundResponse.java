package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RefundResponse(
    UUID id,
    UUID transactionId,
    String transactionReference,
    BigDecimal amount,
    String reason,
    String status,
    String rejectedReason,
    LocalDateTime createdAt
) {}
