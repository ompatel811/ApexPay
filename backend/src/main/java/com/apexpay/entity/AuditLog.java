package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing an immutable system Audit Log entry.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Action is required")
    @Size(max = 255, message = "Action must be less than 255 characters")
    @Column(name = "action", nullable = false)
    private String action;

    @Size(max = 255, message = "Performed by identifier must be less than 255 characters")
    @Column(name = "performed_by")
    private String performedBy;

    @NotBlank(message = "Entity name is required")
    @Size(max = 100, message = "Entity name must be less than 100 characters")
    @Column(name = "entity_name", nullable = false)
    private String entityName;

    @Size(max = 100, message = "Entity ID must be less than 100 characters")
    @Column(name = "entity_id")
    private String entityId;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
