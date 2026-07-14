package com.apexpay.controller.admin;

import com.apexpay.dto.ApiResponse;
import com.apexpay.entity.*;
import com.apexpay.service.admin.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Admin User Management", description = "Endpoints for managing customer accounts, wallets, banks, UPIs, and QR codes")
public class AdminUserController {

    @Autowired
    private AdminService adminService;

    // --- Users ---
    @GetMapping("/users")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Get all users", description = "Retrieves a listing of all registered user profiles")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users list retrieved successfully", adminService.getAllUsers()));
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Get user details", description = "Retrieves profile detail for a specific user")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User detail retrieved successfully", adminService.getUserById(id)));
    }

    @PutMapping("/users/{id}/activate")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Activate user", description = "Transitions user status to ACTIVE")
    public ResponseEntity<ApiResponse<User>> activateUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", adminService.activateUser(id)));
    }

    @PutMapping("/users/{id}/suspend")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Suspend user", description = "Transitions user status to SUSPENDED")
    public ResponseEntity<ApiResponse<User>> suspendUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User suspended successfully", adminService.suspendUser(id)));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Delete user", description = "Performs hard-deletion of a user account")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }

    @PutMapping("/users/{id}/reset-password")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Reset user password", description = "Force-updates user password string")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable UUID id, @RequestParam String newPassword) {
        adminService.resetUserPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success("User password reset successfully"));
    }

    @GetMapping("/users/{id}/activity")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Get user activity timeline", description = "Retrieves administrative and security action logs for a user")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getUserActivity(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User activity logs retrieved", adminService.getUserActivity(id)));
    }

    // --- Wallets ---
    @GetMapping("/wallets")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_WALLETS')")
    @Operation(summary = "Get all wallets", description = "Retrieves a listing of all customer wallets")
    public ResponseEntity<ApiResponse<List<Wallet>>> getAllWallets() {
        return ResponseEntity.ok(ApiResponse.success("Wallets list retrieved successfully", adminService.getAllWallets()));
    }

    @PutMapping("/wallets/{id}/freeze")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_WALLETS')")
    @Operation(summary = "Freeze wallet", description = "Locks transactions on a digital wallet")
    public ResponseEntity<ApiResponse<Wallet>> freezeWallet(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Wallet frozen successfully", adminService.freezeWallet(id)));
    }

    @PutMapping("/wallets/{id}/unfreeze")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_WALLETS')")
    @Operation(summary = "Unfreeze wallet", description = "Enables transactions on a digital wallet")
    public ResponseEntity<ApiResponse<Wallet>> unfreezeWallet(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Wallet unfrozen successfully", adminService.unfreezeWallet(id)));
    }

    @PostMapping("/wallets/{id}/adjust")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_WALLETS')")
    @Operation(summary = "Adjust wallet balance", description = "Performs dynamic simulated manual ledger adjustments")
    public ResponseEntity<ApiResponse<Wallet>> adjustBalance(
            @PathVariable UUID id,
            @RequestParam BigDecimal amount,
            @RequestParam String remarks) {
        return ResponseEntity.ok(ApiResponse.success("Wallet balance adjusted", adminService.adjustWalletBalance(id, amount, remarks)));
    }

    // --- Linked Banks ---
    @GetMapping("/banks")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Get linked banks", description = "Retrieves all user associated bank accounts")
    public ResponseEntity<ApiResponse<List<BankAccount>>> getLinkedBanks() {
        return ResponseEntity.ok(ApiResponse.success("Linked banks retrieved successfully", adminService.getAllLinkedBanks()));
    }

    @PutMapping("/banks/{id}/approve")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Approve bank verification", description = "Appoves bank verification status")
    public ResponseEntity<ApiResponse<BankAccount>> approveBank(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Bank approved successfully", adminService.approveBankVerification(id)));
    }

    @PutMapping("/banks/{id}/reject")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Reject bank verification", description = "Rejects bank verification status")
    public ResponseEntity<ApiResponse<BankAccount>> rejectBank(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Bank rejected successfully", adminService.rejectBankVerification(id)));
    }

    // --- UPI IDs ---
    @GetMapping("/upi")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Get UPI IDs", description = "Retrieves all customer UPI handles")
    public ResponseEntity<ApiResponse<List<UpiId>>> getUpiIds() {
        return ResponseEntity.ok(ApiResponse.success("UPI IDs list retrieved successfully", adminService.getAllUpiIds()));
    }

    @PutMapping("/upi/{id}/deactivate")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Deactivate UPI", description = "Disables routing to a UPI ID handle")
    public ResponseEntity<ApiResponse<UpiId>> deactivateUpi(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("UPI deactivated", adminService.deactivateUpi(id)));
    }

    @PutMapping("/upi/{id}/activate")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Activate UPI", description = "Enables routing to a UPI ID handle")
    public ResponseEntity<ApiResponse<UpiId>> activateUpi(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("UPI activated", adminService.activateUpi(id)));
    }

    @DeleteMapping("/upi/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_USERS')")
    @Operation(summary = "Delete UPI", description = "Hard-deletes a UPI ID record")
    public ResponseEntity<ApiResponse<Void>> deleteUpi(@PathVariable UUID id) {
        adminService.deleteUpi(id);
        return ResponseEntity.ok(ApiResponse.success("UPI ID deleted successfully"));
    }

    // --- QR Management ---
    @GetMapping("/qr")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_QR')")
    @Operation(summary = "Get QR codes", description = "Retrieves standard QR payment records")
    public ResponseEntity<ApiResponse<List<QRCode>>> getQrCodes() {
        return ResponseEntity.ok(ApiResponse.success("QR Codes list retrieved successfully", adminService.getAllQrCodes()));
    }

    @PutMapping("/qr/{id}/deactivate")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_QR')")
    @Operation(summary = "Deactivate QR", description = "Disables QR scan checkouts")
    public ResponseEntity<ApiResponse<QRCode>> deactivateQr(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("QR Code deactivated", adminService.deactivateQr(id)));
    }

    @DeleteMapping("/qr/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_QR')")
    @Operation(summary = "Delete QR", description = "Hard-deletes QR scan record")
    public ResponseEntity<ApiResponse<Void>> deleteQr(@PathVariable UUID id) {
        adminService.deleteQr(id);
        return ResponseEntity.ok(ApiResponse.success("QR Code deleted successfully"));
    }

    @GetMapping("/qr/{id}/usage")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_QR')")
    @Operation(summary = "Get QR usage scans", description = "Simulates scan transaction count for a QR record")
    public ResponseEntity<ApiResponse<Long>> getQrUsage(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("QR Code usage stats retrieved", adminService.getQrUsage(id)));
    }
}
