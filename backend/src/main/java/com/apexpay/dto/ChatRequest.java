package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
    @NotBlank(message = "Message content is required")
    String message
) {}
