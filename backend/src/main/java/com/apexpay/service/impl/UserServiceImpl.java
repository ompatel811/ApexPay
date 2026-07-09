package com.apexpay.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.apexpay.dto.AuditLogResponse;
import com.apexpay.dto.DeviceSessionResponse;
import com.apexpay.dto.UpdateProfileRequest;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.entity.DeviceSession;
import com.apexpay.entity.User;
import com.apexpay.exception.DuplicateUserException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.AuditLogRepository;
import com.apexpay.repository.DeviceSessionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.UserService;

/**
 * Service implementation for managing user information.
 */
@Service
@SuppressWarnings("null")
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private DeviceSessionRepository deviceSessionRepository;

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return mapToProfileResponse(user);
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
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

    @Override
    @Transactional
    public UserProfileResponse uploadProfilePhoto(UUID userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new com.apexpay.exception.BusinessException("Uploaded file cannot be empty.");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw new com.apexpay.exception.BusinessException("Only JPEG, PNG, and WEBP images are allowed.");
        }
        
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new com.apexpay.exception.BusinessException("File size exceeds the 5MB limit.");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                
        try {
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            // Clean up old file if exists
            if (user.getProfilePhoto() != null && user.getProfilePhoto().startsWith("/uploads/")) {
                String oldFilename = user.getProfilePhoto().substring("/uploads/".length());
                Path oldFilePath = uploadDir.resolve(oldFilename);
                Files.deleteIfExists(oldFilePath);
            }
            
            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.lastIndexOf(".") != -1) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String newFilename = userId.toString() + "_" + UUID.randomUUID() + extension;
            Path targetPath = uploadDir.resolve(newFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            
            user.setProfilePhoto("/uploads/" + newFilename);
            User updatedUser = userRepository.save(user);
            
            auditService.log("USER_UPDATE_PROFILE_PHOTO", userId, "User", userId);
            
            return mapToProfileResponse(updatedUser);
        } catch (IOException e) {
            throw new com.apexpay.exception.BusinessException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public UserProfileResponse removeProfilePhoto(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                
        if (user.getProfilePhoto() != null && user.getProfilePhoto().startsWith("/uploads/")) {
            try {
                Path uploadDir = Paths.get("uploads");
                String filename = user.getProfilePhoto().substring("/uploads/".length());
                Path filePath = uploadDir.resolve(filename);
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // ignore
            }
        }
        
        user.setProfilePhoto(null);
        User updatedUser = userRepository.save(user);
        
        auditService.log("USER_DELETE_PROFILE_PHOTO", userId, "User", userId);
        
        return mapToProfileResponse(updatedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getUserActivity(UUID userId) {
        return auditLogRepository.findByPerformedByOrderByTimestampDesc(userId.toString())
                .stream()
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getAction(),
                        log.getPerformedBy(),
                        log.getEntityName(),
                        log.getEntityId(),
                        log.getTimestamp()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeviceSessionResponse> getUserSessions(UUID userId) {
        return deviceSessionRepository.findByUserId(userId)
                .stream()
                .map(session -> new DeviceSessionResponse(
                        session.getId(),
                        session.getDeviceName(),
                        session.getBrowser(),
                        session.getOperatingSystem(),
                        session.getIpAddress(),
                        session.getLastLogin(),
                        session.getIsActive()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void revokeSession(UUID userId, UUID sessionId) {
        DeviceSession session = deviceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));
                
        if (!session.getUser().getId().equals(userId)) {
            throw new com.apexpay.exception.ForbiddenException("You do not have permission to revoke this session.");
        }
        
        session.setIsActive(false);
        deviceSessionRepository.save(session);
        
        auditService.log("REVOKE_SESSION", userId, "DeviceSession", sessionId);
    }
}
