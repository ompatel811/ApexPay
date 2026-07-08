package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionStatementItem(
    String transactionReference,
    LocalDateTime timestamp,
    String type,
    String description,
    String direction,
    BigDecimal amount,
    String category,
    String status
) {}
