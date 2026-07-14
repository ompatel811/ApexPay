package com.apexpay.entity.admin;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "investigations")
public class Investigation {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Fraud alert association is required")
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "alert_id", nullable = false, unique = true)
    private FraudAlert alert;

    @NotBlank(message = "Investigation status is required")
    @Size(max = 50)
    @Column(name = "status", nullable = false)
    private String status = "OPEN"; // OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE

    @Size(max = 150)
    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @NotNull
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
