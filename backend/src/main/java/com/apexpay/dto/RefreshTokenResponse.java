package com.apexpay.dto;

/**
 * DTO returned after a token refresh operation.
 */
public record RefreshTokenResponse(
        String accessToken,
        String refreshToken,
        Long tokenExpiry
) {}
