package com.apexpay.controller.admin;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.admin.*;
import com.apexpay.entity.User;
import com.apexpay.security.AdminPrincipal;
import com.apexpay.service.admin.FraudService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fraud")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Admin Fraud & Risk Management", description = "Endpoints for managing blacklists, whitelists, fraud alerts, and investigations")
public class AdminFraudController {

    @Autowired
    private FraudService fraudService;

    @GetMapping("/alerts")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Get all fraud alerts", description = "Retrieves listing of recent system-generated risk and fraud alerts")
    public ResponseEntity<ApiResponse<List<FraudAlertResponse>>> getFraudAlerts() {
        return ResponseEntity.ok(ApiResponse.success("Fraud alerts list retrieved successfully", fraudService.getAllAlerts()));
    }

    @GetMapping("/high-risk")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Get high risk users", description = "Retrieves list of users with critical or high risk scores")
    public ResponseEntity<ApiResponse<List<User>>> getHighRiskUsers() {
        return ResponseEntity.ok(ApiResponse.success("High-risk users retrieved successfully", fraudService.getHighRiskUsers()));
    }

    @PostMapping("/review")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Review fraud alert", description = "Allows administrators to resolve or transition alert status and write notes")
    public ResponseEntity<ApiResponse<FraudAlertResponse>> reviewAlert(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody FraudReviewRequest request) {
        String username = principal != null ? principal.getUsername() : "admin";
        return ResponseEntity.ok(ApiResponse.success("Alert reviewed successfully", fraudService.reviewAlert(request, username)));
    }

    @PostMapping("/block")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Block entity (blacklist)", description = "Adds an item (IP, Device, User, Wallet, Merchant, UPI) to the blacklist")
    public ResponseEntity<ApiResponse<Void>> blockEntity(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody BlacklistRequest request) {
        String username = principal != null ? principal.getUsername() : "admin";
        fraudService.blockEntity(request, username);
        return ResponseEntity.ok(ApiResponse.success("Entity blacklisted successfully"));
    }

    @PostMapping("/freeze")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Freeze entity", description = "Performs an emergency lock/freeze on a wallet, user, or merchant account")
    public ResponseEntity<ApiResponse<Void>> freezeEntity(
            @AuthenticationPrincipal AdminPrincipal principal,
            @RequestParam String type,
            @RequestParam UUID id) {
        String username = principal != null ? principal.getUsername() : "admin";
        fraudService.freezeEntity(type, id, username);
        return ResponseEntity.ok(ApiResponse.success("Entity frozen successfully"));
    }

    @PostMapping("/whitelist")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Whitelist entity", description = "Allows administrators to trust a device, wallet, or merchant and bypass specific risk checks")
    public ResponseEntity<ApiResponse<Void>> whitelistEntity(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody WhitelistRequest request) {
        String username = principal != null ? principal.getUsername() : "admin";
        fraudService.whitelistEntity(request, username);
        return ResponseEntity.ok(ApiResponse.success("Entity whitelisted successfully"));
    }

    @GetMapping("/investigation/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Get investigation details", description = "Retrieves audit timeline, case assignment, and resolution details of a fraud alert case")
    public ResponseEntity<ApiResponse<InvestigationResponse>> getInvestigation(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Investigation case loaded successfully", fraudService.getInvestigation(id)));
    }

    @PutMapping("/investigation/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_FRAUD')")
    @Operation(summary = "Update investigation case", description = "Allows updates to assignment notes and investigation status")
    public ResponseEntity<ApiResponse<InvestigationResponse>> updateInvestigation(
            @AuthenticationPrincipal AdminPrincipal principal,
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam String notes) {
        String username = principal != null ? principal.getUsername() : "admin";
        return ResponseEntity.ok(ApiResponse.success("Investigation updated successfully", fraudService.updateInvestigation(id, status, notes, username)));
    }
}
