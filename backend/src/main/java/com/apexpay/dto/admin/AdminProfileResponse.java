package com.apexpay.dto.admin;

import java.util.Set;
import java.util.UUID;

public record AdminProfileResponse(
    UUID id,
    String fullName,
    String username,
    String email,
    String status,
    Set<String> roles,
    Set<String> permissions
) {}
