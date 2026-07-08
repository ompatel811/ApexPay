package com.apexpay.controller;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.NotificationResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Notification System", description = "Endpoints for managing user notifications, unread counters and read status updates")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get Notification History", description = "Retrieves all notifications for the authenticated user.")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        List<NotificationResponse> list = notificationService.getNotificationsForUser(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", list));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get Unread Notifications", description = "Retrieves only unread notifications for the authenticated user.")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        List<NotificationResponse> list = notificationService.getUnreadNotificationsForUser(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved successfully", list));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark Notification as Read", description = "Marks a specific notification as read.")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        NotificationResponse response = notificationService.markAsRead(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", response));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark All Notifications as Read", description = "Marks all unread notifications for the user as read.")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        notificationService.markAllAsRead(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Notification", description = "Permanently deletes a notification.")
    public ResponseEntity<ApiResponse<String>> deleteNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        notificationService.deleteNotification(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }
}
