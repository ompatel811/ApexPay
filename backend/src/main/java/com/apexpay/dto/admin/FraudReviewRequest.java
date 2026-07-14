package com.apexpay.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record FraudReviewRequest(
    @NotNull(message = "Alert ID is required")
    UUID alertId,
    
    @NotBlank(message = "Status is required")
    String status, // CLOSED_RESOLVED, CLOSED_FALSE_POSITIVE, INVESTIGATING
    
    String notes
) {}
