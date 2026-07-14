package com.apexpay.dto.admin;

import java.time.LocalDateTime;
import java.util.UUID;

public record InvestigationResponse(
    UUID id,
    FraudAlertResponse alert,
    String status,
    String assignedTo,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
