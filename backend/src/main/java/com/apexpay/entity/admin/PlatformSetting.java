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
@Table(name = "platform_settings")
public class PlatformSetting {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Setting key is required")
    @Size(max = 100, message = "Setting key must be less than 100 characters")
    @Column(name = "setting_key", nullable = false, unique = true)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;

    @Size(max = 255, message = "Description must be less than 255 characters")
    @Column(name = "description")
    private String description;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Size(max = 150, message = "Updated by must be less than 150 characters")
    @Column(name = "updated_by")
    private String updatedBy = "SYSTEM";

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
