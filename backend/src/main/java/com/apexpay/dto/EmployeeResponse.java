package com.apexpay.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeResponse(
    UUID id,
    UUID userId,
    String fullName,
    String email,
    String role,
    String status,
    LocalDateTime createdAt
) {}
