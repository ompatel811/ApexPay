package com.apexpay.service;

import com.apexpay.dto.UpdateProfileRequest;
import com.apexpay.dto.UserProfileResponse;

import java.util.UUID;

/**
 * Service interface for querying and updating User information.
 */
public interface UserService {
    UserProfileResponse getProfile(UUID userId);
    UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request);
    UserProfileResponse uploadProfilePhoto(UUID userId, org.springframework.web.multipart.MultipartFile file);
    UserProfileResponse removeProfilePhoto(UUID userId);
    java.util.List<com.apexpay.dto.AuditLogResponse> getUserActivity(UUID userId);
    java.util.List<com.apexpay.dto.DeviceSessionResponse> getUserSessions(UUID userId);
    void revokeSession(UUID userId, UUID sessionId);
}
