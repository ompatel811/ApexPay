package com.apexpay.service.impl;

import com.apexpay.dto.UpdateProfileRequest;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.entity.User;
import com.apexpay.exception.DuplicateUserException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation for managing user information.
 */
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return mapToProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Uniqueness checks if email is changing
        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new DuplicateUserException("Email address is already in use.");
            }
            user.setEmail(request.email());
        }

        // Uniqueness checks if mobile number is changing
        if (request.mobileNumber() != null && !request.mobileNumber().equals(user.getMobileNumber())) {
            if (userRepository.existsByMobileNumber(request.mobileNumber())) {
                throw new DuplicateUserException("Mobile number is already in use.");
            }
            user.setMobileNumber(request.mobileNumber());
        }

        user.setFullName(request.fullName());
        user.setDateOfBirth(request.dateOfBirth());
        user.setProfilePhoto(request.profilePhoto());

        User updatedUser = userRepository.save(user);

        // Audit Log
        auditService.log("USER_UPDATE_PROFILE", userId, "User", userId);

        return mapToProfileResponse(updatedUser);
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getProfilePhoto(),
                user.getDateOfBirth(),
                user.getAccountStatus().name(),
                roles
        );
    }
}
