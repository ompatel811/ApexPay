package com.apexpay.dto.admin;

import java.time.LocalDateTime;

public record SystemHealthResponse(
    double cpuUsage,
    double memoryUsage,
    int apiResponseTimeMs,
    String databaseStatus,
    String redisStatus,
    String applicationHealth,
    String websocketStatus,
    LocalDateTime timestamp
) {}
