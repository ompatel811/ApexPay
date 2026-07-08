package com.apexpay.controller;

import com.apexpay.dto.AddBeneficiaryRequest;
import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.BeneficiaryResponse;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.BeneficiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Beneficiary Management", description = "Endpoints for managing saved contacts and searching platform users")
@SecurityRequirement(name = "Bearer Authentication")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    @PostMapping
    @Operation(summary = "Add Saved Contact Beneficiary", description = "Saves another user as a beneficiary for fast peer payments.")
    public ResponseEntity<ApiResponse<BeneficiaryResponse>> addBeneficiary(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AddBeneficiaryRequest request) {
        
        BeneficiaryResponse response = beneficiaryService.addBeneficiary(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary contact added successfully", response));
    }

    @GetMapping
    @Operation(summary = "List Saved Beneficiary Contacts", description = "Retrieves all saved payment contacts for the authenticated user.")
    public ResponseEntity<ApiResponse<List<BeneficiaryResponse>>> getBeneficiaries(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        List<BeneficiaryResponse> list = beneficiaryService.getBeneficiaries(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Beneficiaries retrieved successfully", list));
    }

    @GetMapping("/search")
    @Operation(summary = "Search Platform Senders/Recipients", description = "Searches system users by username, email, full name or phone. Excludes current user.")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> searchUsers(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam String q) {
        
        List<UserProfileResponse> list = beneficiaryService.searchPlatformUsers(userPrincipal.getId(), q);
        return ResponseEntity.ok(ApiResponse.success("Platform users search completed", list));
    }
}
