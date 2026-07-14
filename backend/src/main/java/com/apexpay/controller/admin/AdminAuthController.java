package com.apexpay.controller.admin;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.admin.AdminLoginRequest;
import com.apexpay.dto.admin.AdminLoginResponse;
import com.apexpay.dto.admin.AdminProfileResponse;
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

@RestController
@RequestMapping("/api/admin/auth")
@Tag(name = "Admin Authentication", description = "Endpoints for administrator logins and session details")
public class AdminAuthController {

    @Autowired
    private AdminService adminService;

    @PostMapping("/login")
    @Operation(summary = "Admin login", description = "Authenticates administrator credentials and returns a JWT token")
    public ResponseEntity<ApiResponse<AdminLoginResponse>> login(@Valid @RequestBody AdminLoginRequest request) {
        AdminLoginResponse response = adminService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Admin login successful", response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current admin profile", description = "Retrieves profile and permissions of the currently authenticated administrator")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> getProfile(@AuthenticationPrincipal AdminPrincipal principal) {
        AdminProfileResponse response = adminService.getProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Admin profile retrieved successfully", response));
    }
}
