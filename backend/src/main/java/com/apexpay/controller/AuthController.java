package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.entity.User;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.AuthenticationService;
import com.apexpay.service.PasswordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller handling user registration, authentication, token refresh, and password recovery.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user onboarding and session management")
public class AuthController {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Onboards a new customer and sets up their initial digital wallet.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = com.apexpay.dto.ApiResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation errors or password mismatch"),
            @ApiResponse(responseCode = "409", description = "Username, email, or mobile number already in use")
    })
    public ResponseEntity<com.apexpay.dto.ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates credentials and issues access and refresh tokens.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = com.apexpay.dto.ApiResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<com.apexpay.dto.ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        
        // Extract Device / Client Info
        String userAgent = servletRequest.getHeader("User-Agent");
        String ipAddress = servletRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = servletRequest.getRemoteAddr();
        }

        // Simple User-Agent parsing
        String browser = "Unknown Browser";
        String os = "Unknown OS";
        String device = "Desktop";

        if (userAgent != null) {
            if (userAgent.contains("Chrome")) browser = "Chrome";
            else if (userAgent.contains("Safari")) browser = "Safari";
            else if (userAgent.contains("Firefox")) browser = "Firefox";

            if (userAgent.contains("Windows")) os = "Windows";
            else if (userAgent.contains("Macintosh")) os = "Mac OS";
            else if (userAgent.contains("Android")) { os = "Android"; device = "Mobile"; }
            else if (userAgent.contains("iPhone")) { os = "iOS"; device = "Mobile"; }
        }

        LoginResponse response = authenticationService.login(request, device, browser, os, ipAddress);
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "User logout", description = "Revokes user refresh token and terminates active session.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {
        authenticationService.logout(request.refreshToken());
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Logged out successfully."));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh session", description = "Uses a valid refresh token to rotate new access and refresh tokens.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<RefreshTokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authenticationService.refresh(request);
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Token refreshed successfully.", response));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Generates a secure password reset token for the given email.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.email()));

        String token = passwordService.generateResetToken(user);
        
        // In production, send this via email. We return the token for testing/education.
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success(
                "Password reset token generated successfully. Send token via email.", token));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Validates the reset token and updates the user's password.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new BusinessException("Passwords do not match.");
        }

        passwordService.verifyResetTokenAndChange(request.token(), request.newPassword());
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Password reset successfully."));
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password", description = "Updates password for currently authenticated user after verifying old password.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new BusinessException("New passwords do not match.");
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordService.verifyCurrentPassword(user, request.currentPassword())) {
            throw new BusinessException("Invalid current password.");
        }

        passwordService.validatePasswordStrength(request.newPassword());
        user.setPasswordHash(passwordService.hashPassword(request.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Password changed successfully."));
    }
}
