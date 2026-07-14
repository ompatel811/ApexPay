package com.apexpay.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record AdminLoginRequest(
    @NotBlank(message = "Username or email is required")
    String usernameOrEmail,

    @NotBlank(message = "Password is required")
    String password
) {}
