package com.apexpay.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UpiResponse(
    UUID id,
    String upiId,
    boolean isPrimary,
    String status,
    LocalDateTime createdAt
) {}
