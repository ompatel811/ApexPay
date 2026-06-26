package com.apexpay.dto;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * DTO representing user profile details.
 */
public record UserProfileResponse(
        UUID id,
        String fullName,
        String username,
        String email,
        String mobileNumber,
        String profilePhoto,
        LocalDate dateOfBirth,
        String accountStatus,
        Set<String> roles
) {}
