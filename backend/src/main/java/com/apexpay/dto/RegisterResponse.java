package com.apexpay.dto;

import java.util.UUID;

/**
 * DTO for user registration response.
 */
public record RegisterResponse(
        UUID id,
        String fullName,
        String username,
        String email,
        String mobileNumber,
        String message
) {}
