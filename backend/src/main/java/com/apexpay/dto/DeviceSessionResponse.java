package com.apexpay.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing an active user login Device Session.
 */
public record DeviceSessionResponse(
        UUID id,
        String deviceName,
        String browser,
        String operatingSystem,
        String ipAddress,
        LocalDateTime lastLogin,
        Boolean isActive
) {}
