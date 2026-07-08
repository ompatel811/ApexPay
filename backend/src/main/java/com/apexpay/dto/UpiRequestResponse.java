package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record UpiRequestResponse(
    UUID id,
    UUID requesterId,
    String requesterName,
    String requesterUpi,
    UUID payerId,
    String payerName,
    String payerUpi,
    BigDecimal amount,
    String remarks,
    String status,
    LocalDateTime createdAt
) {}
