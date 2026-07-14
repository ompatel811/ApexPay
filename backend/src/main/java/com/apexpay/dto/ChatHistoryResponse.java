package com.apexpay.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatHistoryResponse(
    UUID id,
    String role,
    String message,
    LocalDateTime createdAt
) {}
