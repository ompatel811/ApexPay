package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.UpiService;
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
@RequestMapping("/api/upi")
@PreAuthorize("isAuthenticated()")
@Tag(name = "UPI Management & Simulation", description = "Endpoints for creating and managing UPI IDs, performing UPI transfers and processing collect requests")
@SecurityRequirement(name = "Bearer Authentication")
public class UpiController {

    private final UpiService upiService;

    public UpiController(UpiService upiService) {
        this.upiService = upiService;
    }

    @PostMapping("/create")
    @Operation(summary = "Create UPI ID", description = "Creates a new virtual payment address (UPI ID) mapped to the user's linked bank account.")
    public ResponseEntity<ApiResponse<UpiResponse>> createUpiId(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateUpiRequest request) {
        
        UpiResponse response = upiService.createUpiId(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("UPI ID created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get Linked UPI IDs", description = "Retrieves all registered UPI IDs associated with the authenticated user.")
    public ResponseEntity<ApiResponse<List<UpiResponse>>> getUpiIds(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        List<UpiResponse> list = upiService.getUpiIds(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Linked UPI IDs retrieved successfully", list));
    }

    @PutMapping("/default")
    @Operation(summary = "Set Default UPI ID", description = "Sets a selected UPI ID as the primary/default address for payments.")
    public ResponseEntity<ApiResponse<UpiResponse>> setDefaultUpi(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam UUID upiId) {
        
        UpiResponse response = upiService.setDefaultUpi(upiId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Default UPI ID updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete UPI ID", description = "Deactivates and removes a specific virtual payment address.")
    public ResponseEntity<ApiResponse<String>> deleteUpiId(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        upiService.deleteUpiId(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("UPI ID deleted successfully", null));
    }

    @GetMapping("/check-availability")
    @Operation(summary = "Check UPI ID Availability", description = "Checks whether a given UPI ID handle is available for registration.")
    public ResponseEntity<ApiResponse<Boolean>> checkAvailability(
            @RequestParam String upiId) {
        
        boolean available = upiService.checkUpiAvailability(upiId);
        return ResponseEntity.ok(ApiResponse.success("Availability status checked", available));
    }

    @PostMapping("/pay")
    @Operation(summary = "Pay Using UPI ID", description = "Simulates performing a transfer from the sender's UPI ID to the receiver's UPI ID. Reuses core wallet payment engine.")
    public ResponseEntity<ApiResponse<SendMoneyResponse>> payUsingUpi(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpiPayRequest request) {
        
        SendMoneyResponse response = upiService.payUsingUpi(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("UPI Payment completed successfully", response));
    }

    @PostMapping("/request-money")
    @Operation(summary = "Request Money (Collect Request)", description = "Creates a payment collect request from the sender to a payer's UPI ID.")
    public ResponseEntity<ApiResponse<UpiRequestResponse>> requestMoney(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RequestMoneyRequest request) {
        
        UpiRequestResponse response = upiService.requestMoney(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Money collect request sent successfully", response));
    }

    @GetMapping("/requests")
    @Operation(summary = "Get Pending & Past UPI Requests", description = "Retrieves all collect requests involving the authenticated user (both sent and received).")
    public ResponseEntity<ApiResponse<List<UpiRequestResponse>>> getRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        List<UpiRequestResponse> list = upiService.getUpiRequests(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("UPI requests retrieved successfully", list));
    }

    @PostMapping("/request/{id}/accept")
    @Operation(summary = "Accept Collect Request", description = "Authorizes the debit transfer for a pending collect request. Debits the payer's wallet and credits the requester.")
    public ResponseEntity<ApiResponse<SendMoneyResponse>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @RequestParam String idempotencyKey) {
        
        SendMoneyResponse response = upiService.acceptUpiRequest(userPrincipal.getId(), id, idempotencyKey);
        return ResponseEntity.ok(ApiResponse.success("Collect request accepted and payment processed", response));
    }

    @PostMapping("/request/{id}/reject")
    @Operation(summary = "Reject Collect Request", description = "Declines a pending collect request.")
    public ResponseEntity<ApiResponse<String>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        upiService.rejectUpiRequest(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Collect request rejected successfully", null));
    }
}
