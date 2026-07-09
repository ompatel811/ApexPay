package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

public record KycVerifySimulateRequest(
    @NotBlank(message = "Verification status (APPROVED or REJECTED) is required")
    String status,

    String rejectedReason
) {}
