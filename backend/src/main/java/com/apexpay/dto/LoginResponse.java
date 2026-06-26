package com.apexpay.dto;

/**
 * DTO returned after successful authentication.
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        Long tokenExpiry,
        UserProfileResponse user
) {}
