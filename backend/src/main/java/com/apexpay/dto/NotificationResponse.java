package com.apexpay.dto;

import com.apexpay.entity.enums.NotificationType;
import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String title,
    String message,
    NotificationType notificationType,
    boolean read,
    LocalDateTime createdAt
) {}
