package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for token refresh requests.
 */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {}
