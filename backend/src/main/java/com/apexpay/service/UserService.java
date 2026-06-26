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
}
