package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * DTO for updating user profile information.
 */
public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 255, message = "Full name must be less than 255 characters")
        String fullName,

        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,

        @Size(max = 512, message = "Profile photo URL must be less than 512 characters")
        String profilePhoto,

        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Please provide a valid mobile number in E.164 format")
        String mobileNumber,

        String email
) {}
