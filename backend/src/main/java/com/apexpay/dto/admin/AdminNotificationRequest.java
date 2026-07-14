package com.apexpay.dto.admin;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record AdminNotificationRequest(
    UUID userId,
    @NotBlank(message = "Title is required")
    String title,
    @NotBlank(message = "Message is required")
    String message,
    String notificationType,
    String scheduledTime
) {}
