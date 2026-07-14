package com.apexpay.controller.admin;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.admin.*;
import com.apexpay.entity.AuditLog;
import com.apexpay.entity.Notification;
import com.apexpay.security.AdminPrincipal;
import com.apexpay.service.admin.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Admin System Operations", description = "Endpoints for checking global configurations, logs, alerts, and system health metrics")
public class AdminSystemController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard analytics", description = "Retrieves aggregate platform counts for users, wallets, transactions, and revenue")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboardData() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics loaded successfully", adminService.getDashboardData()));
    }

    @GetMapping("/system-health")
    @Operation(summary = "Get system health benchmarks", description = "Retrieves CPU, Memory, Latency, and Database connectivity statuses")
    public ResponseEntity<ApiResponse<SystemHealthResponse>> getSystemHealth() {
        return ResponseEntity.ok(ApiResponse.success("System health metrics computed", adminService.getSystemHealth()));
    }

    @GetMapping("/system-health/history")
    @Operation(summary = "Get system health logs", description = "Retrieves the last 30 system health log entries")
    public ResponseEntity<ApiResponse<List<SystemHealthResponse>>> getSystemHealthHistory() {
        return ResponseEntity.ok(ApiResponse.success("System health log history loaded", adminService.getSystemHealthHistory()));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_SETTINGS')")
    @Operation(summary = "Get platform settings", description = "Retrieves global limits and maintenance configurations")
    public ResponseEntity<ApiResponse<List<PlatformSettingDto>>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success("Platform settings retrieved successfully", adminService.getSettings()));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_SETTINGS')")
    @Operation(summary = "Update platform setting", description = "Modifies a specific platform setting key")
    public ResponseEntity<ApiResponse<PlatformSettingDto>> updateSetting(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody PlatformSettingDto request) {
        return ResponseEntity.ok(ApiResponse.success("Platform setting updated", adminService.updateSetting(request.key(), request.value(), principal.getUsername())));
    }

    @PostMapping("/notifications")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_NOTIFICATIONS')")
    @Operation(summary = "Send notifications", description = "Broadcasts or sends direct custom announcements to users")
    public ResponseEntity<ApiResponse<Notification>> sendNotification(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody AdminNotificationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Notification sent successfully", adminService.sendAdminNotification(request, principal.getUsername())));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get platform audit logs", description = "Retrieves complete immutable system action logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", adminService.getAuditLogs()));
    }
}
