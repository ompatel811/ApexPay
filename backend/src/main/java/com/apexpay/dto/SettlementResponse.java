package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record SettlementResponse(
    UUID id,
    String referenceNumber,
    BigDecimal amount,
    String currency,
    String settlementType,
    String status,
    LocalDateTime settledAt,
    LocalDateTime createdAt
) {}
