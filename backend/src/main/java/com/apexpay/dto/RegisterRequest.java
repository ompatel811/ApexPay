package com.apexpay.dto;

import jakarta.validation.constraints.*;

/**
 * DTO for user registration requests.
 */
public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 255, message = "Full name must be less than 255 characters")
        String fullName,

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_.]+$", message = "Username can only contain alphanumeric characters, underscores, and periods")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        @Size(max = 150, message = "Email must be less than 150 characters")
        String email,

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Please provide a valid mobile number in E.164 format")
        String mobileNumber,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
        String password,

        @NotBlank(message = "Confirm password is required")
        String confirmPassword
) {}
