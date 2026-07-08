package com.apexpay.controller;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.BankAccountResponse;
import com.apexpay.dto.LinkBankAccountRequest;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.BankAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Bank Account Management", description = "Endpoints for linking, unlinking and managing external bank accounts")
@SecurityRequirement(name = "Bearer Authentication")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    @PostMapping("/link")
    @Operation(summary = "Link Bank Account", description = "Links an external bank account to the user profile and performs simulated verification.")
    public ResponseEntity<ApiResponse<BankAccountResponse>> linkBankAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody LinkBankAccountRequest request) {
        
        BankAccountResponse response = bankAccountService.linkBankAccount(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Bank account linked successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get Linked Bank Accounts", description = "Retrieves all linked bank accounts for the authenticated user.")
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getBankAccounts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        List<BankAccountResponse> list = bankAccountService.getBankAccounts(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Linked bank accounts retrieved successfully", list));
    }

    @PutMapping("/{id}/primary")
    @Operation(summary = "Set Primary Bank Account", description = "Configures a specific bank account as the primary account for the user.")
    public ResponseEntity<ApiResponse<BankAccountResponse>> setPrimaryBankAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        BankAccountResponse response = bankAccountService.setPrimaryBankAccount(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Primary bank account updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove Bank Account", description = "Removes/unlinks a bank account from the user's profile.")
    public ResponseEntity<ApiResponse<String>> deleteBankAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        bankAccountService.deleteBankAccount(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Bank account unlinked successfully", null));
    }
}
