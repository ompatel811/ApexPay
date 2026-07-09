package com.apexpay.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteEmployeeRequest(
    @NotBlank(message = "Employee email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Role name is required")
    String role
) {}
