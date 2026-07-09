package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateEmployeeRequest(
    @NotBlank(message = "Role name is required")
    String role,

    @NotBlank(message = "Status is required")
    String status
) {}
