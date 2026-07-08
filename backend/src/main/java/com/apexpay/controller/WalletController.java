package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller handling user digital wallet balance updates, add money operations, withdrawals, and timelines.
 */
@RestController
@RequestMapping("/api/wallet")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Wallet Management", description = "Endpoints for managing balances, ledger receipts, simulated money inputs, and statistics")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    @Operation(summary = "Get wallet details", description = "Retrieves wallet information, currency, status, and transaction limits for the authenticated user.")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        WalletResponse wallet = walletService.getWallet(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Wallet details retrieved successfully", wallet));
    }

    @GetMapping("/balance")
    @Operation(summary = "Get wallet balance", description = "Retrieves available settlement balance for the authenticated user.")
    public ResponseEntity<ApiResponse<WalletBalanceResponse>> getBalance(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        WalletBalanceResponse balance = walletService.getBalance(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Balance retrieved successfully", balance));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get wallet monthly summary", description = "Retrieves spending totals and incoming credits summaries.")
    public ResponseEntity<ApiResponse<WalletSummaryResponse>> getSummary(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        WalletSummaryResponse summary = walletService.getSummary(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Wallet summary retrieved successfully", summary));
    }

    @PostMapping("/add-money")
    @Operation(summary = "Simulate Add Money", description = "Simulates adding money from a linked funding source to the user's wallet.")
    public ResponseEntity<ApiResponse<AddMoneyResponse>> addMoney(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AddMoneyRequest request) {
        AddMoneyResponse response = walletService.addMoney(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Money added successfully", response));
    }

    @PostMapping("/withdraw")
    @Operation(summary = "Simulate Withdraw", description = "Simulates withdrawing funds from the wallet after validating against available balance and limits.")
    public ResponseEntity<ApiResponse<WithdrawResponse>> withdraw(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody WithdrawRequest request) {
        WithdrawResponse response = walletService.withdraw(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal processed successfully", response));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Get ledger entries", description = "Retrieves an immutable audit list of all transaction histories for the wallet.")
    public ResponseEntity<ApiResponse<List<WalletLedgerResponse>>> getLedger(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<WalletLedgerResponse> ledger = walletService.getLedger(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Ledger entries retrieved successfully", ledger));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get wallet analytics", description = "Retrieves average sizes, total debits/credits, and largest transactions statistics.")
    public ResponseEntity<ApiResponse<WalletAnalyticsResponse>> getAnalytics(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        WalletAnalyticsResponse analytics = walletService.getAnalytics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Analytics retrieved successfully", analytics));
    }
}
