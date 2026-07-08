package com.apexpay.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing an audit log entry.
 */
public record AuditLogResponse(
        UUID id,
        String action,
        String performedBy,
        String entityName,
        String entityId,
        LocalDateTime timestamp
) {}
