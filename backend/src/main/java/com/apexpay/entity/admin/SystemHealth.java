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
@Table(name = "system_health")
public class SystemHealth {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "CPU usage is required")
    @Column(name = "cpu_usage", nullable = false)
    private double cpuUsage;

    @NotNull(message = "Memory usage is required")
    @Column(name = "memory_usage", nullable = false)
    private double memoryUsage;

    @NotNull(message = "API response time is required")
    @Column(name = "api_response_time_ms", nullable = false)
    private int apiResponseTimeMs;

    @NotBlank(message = "Database status is required")
    @Column(name = "database_status", nullable = false, length = 50)
    private String databaseStatus;

    @NotBlank(message = "Redis status is required")
    @Column(name = "redis_status", nullable = false, length = 50)
    private String redisStatus;

    @NotBlank(message = "Application health is required")
    @Column(name = "application_health", nullable = false, length = 50)
    private String applicationHealth;

    @NotBlank(message = "WebSocket status is required")
    @Column(name = "websocket_status", nullable = false, length = 50)
    private String websocketStatus;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
