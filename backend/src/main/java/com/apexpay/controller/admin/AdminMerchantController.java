package com.apexpay.controller.admin;

import com.apexpay.dto.ApiResponse;
import com.apexpay.entity.Merchant;
import com.apexpay.repository.SettlementRepository;
import com.apexpay.service.admin.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/merchants")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Admin Merchant Management", description = "Endpoints for reviewing business merchants, KYC uploads, and settlements")
public class AdminMerchantController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private SettlementRepository settlementRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_MERCHANTS')")
    @Operation(summary = "Get all merchants", description = "Retrieves all business merchants and their KYC status details")
    public ResponseEntity<ApiResponse<List<Merchant>>> getAllMerchants() {
        return ResponseEntity.ok(ApiResponse.success("Merchants list retrieved successfully", adminService.getAllMerchants()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_MERCHANTS')")
    @Operation(summary = "Approve merchant verification", description = "Approves merchant KYC and sets status to APPROVED")
    public ResponseEntity<ApiResponse<Merchant>> approveMerchant(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Merchant approved successfully", adminService.approveMerchant(id)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_MERCHANTS')")
    @Operation(summary = "Reject merchant verification", description = "Rejects merchant KYC and records a reason")
    public ResponseEntity<ApiResponse<Merchant>> rejectMerchant(@PathVariable UUID id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success("Merchant rejected successfully", adminService.rejectMerchant(id, reason)));
    }

    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_MERCHANTS')")
    @Operation(summary = "Suspend merchant", description = "Suspends a merchant's owner account")
    public ResponseEntity<ApiResponse<Merchant>> suspendMerchant(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Merchant suspended successfully", adminService.suspendMerchant(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_MERCHANTS')")
    @Operation(summary = "Delete merchant", description = "Deletes a merchant business profile")
    public ResponseEntity<ApiResponse<Void>> deleteMerchant(@PathVariable UUID id) {
        adminService.deleteMerchant(id);
        return ResponseEntity.ok(ApiResponse.success("Merchant deleted successfully"));
    }

    @GetMapping("/settlements")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_MERCHANTS')")
    @Operation(summary = "Get settlements", description = "Retrieves all settlement logs recorded across merchants")
    public ResponseEntity<ApiResponse<List<com.apexpay.entity.Settlement>>> getAllSettlements() {
        return ResponseEntity.ok(ApiResponse.success("Settlements list retrieved", settlementRepository.findAll()));
    }
}
