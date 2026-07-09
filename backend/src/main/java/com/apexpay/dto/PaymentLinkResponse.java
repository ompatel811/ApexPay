package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentLinkResponse(
    UUID id,
    String referenceNumber,
    BigDecimal amount,
    String currency,
    LocalDateTime expiry,
    String description,
    String status,
    String customerName,
    String customerEmail,
    String customerMobile,
    String payUrl,
    UUID transactionId,
    String businessName,
    LocalDateTime createdAt
) {}
