package com.apexpay.controller;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.AuditLogResponse;
import com.apexpay.dto.DeviceSessionResponse;
import com.apexpay.dto.UpdateProfileRequest;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Controller handling user profiles, profile photo updates, sessions, and activity logs.
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
@Tag(name = "User Management", description = "Endpoints for managing user details, active sessions, and security activity timelines")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Retrieves profile information for the authenticated user.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileResponse profile = userService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Updates personal fields of the authenticated user.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse profile = userService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    @PostMapping(value = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload profile photo", description = "Uploads a new profile image for the user.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadPhoto(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("file") MultipartFile file) {
        UserProfileResponse profile = userService.uploadProfilePhoto(userPrincipal.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("Profile photo uploaded successfully", profile));
    }

    @DeleteMapping("/profile/photo")
    @Operation(summary = "Remove profile photo", description = "Removes the current user's profile image.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> removePhoto(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileResponse profile = userService.removeProfilePhoto(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile photo removed successfully", profile));
    }

    @GetMapping("/activity")
    @Operation(summary = "Get user activity timeline", description = "Retrieves the audit log timeline for the authenticated user.")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getProfileActivity(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<AuditLogResponse> activity = userService.getUserActivity(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Activity timeline retrieved successfully", activity));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Get active device sessions", description = "Lists all device login sessions for the authenticated user.")
    public ResponseEntity<ApiResponse<List<DeviceSessionResponse>>> getSessions(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<DeviceSessionResponse> sessions = userService.getUserSessions(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Active sessions retrieved successfully", sessions));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Revoke device session", description = "Terminates an active login session by its ID.")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") UUID sessionId) {
        userService.revokeSession(userPrincipal.getId(), sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session revoked successfully"));
    }
}
