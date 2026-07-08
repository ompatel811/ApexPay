package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateUpiRequest(
    @NotBlank(message = "UPI handle is required")
    @Pattern(regexp = "^[a-zA-Z0-9.\\-_]+$", message = "UPI handle can only contain alphanumeric characters, dots, hyphens, and underscores")
    String upiHandle
) {}
