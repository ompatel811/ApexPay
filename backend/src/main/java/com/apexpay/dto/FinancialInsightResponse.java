package com.apexpay.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record FinancialInsightResponse(
    UUID id,
    String type,
    String title,
    String description,
    LocalDateTime createdAt
) {}
