package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for user login requests.
 */
public record LoginRequest(
        @NotBlank(message = "Identifier (email or mobile) is required")
        String identifier,

        @NotBlank(message = "Password is required")
        String password
) {}
