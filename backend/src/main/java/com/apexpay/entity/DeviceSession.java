package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity representing an active user login Device Session.
 */
@Getter
@Setter
@Entity
@Table(name = "device_sessions")
public class DeviceSession extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Size(max = 150, message = "Device name must be less than 150 characters")
    @Column(name = "device_name")
    private String deviceName;

    @Size(max = 100, message = "Browser name must be less than 100 characters")
    @Column(name = "browser")
    private String browser;

    @Size(max = 100, message = "Operating system must be less than 100 characters")
    @Column(name = "operating_system")
    private String operatingSystem;

    @Size(max = 50, message = "IP Address must be less than 50 characters")
    @Column(name = "ip_address")
    private String ipAddress;

    @NotNull(message = "Last login timestamp is required")
    @Column(name = "last_login", nullable = false)
    private LocalDateTime lastLogin;

    @NotNull(message = "isActive flag is required")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
