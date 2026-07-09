package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.PaymentService;
import com.apexpay.service.ReceiptService;
import com.apexpay.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Payment Engine", description = "Endpoints for wallet-to-wallet transfers, dry-run validations, receipts and history")
@SecurityRequirement(name = "Bearer Authentication")
public class PaymentController {

    private final PaymentService paymentService;
    private final TransactionService transactionService;
    private final ReceiptService receiptService;

    public PaymentController(PaymentService paymentService,
                             TransactionService transactionService,
                             ReceiptService receiptService) {
        this.paymentService = paymentService;
        this.transactionService = transactionService;
        this.receiptService = receiptService;
    }

    @PostMapping("/send")
    @Operation(summary = "Send Money (Wallet-to-Wallet)", description = "Initiates a real-time secure transfer of funds between two wallets. Uses idempotency key for replay protection.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<SendMoneyResponse>> sendMoney(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody SendMoneyRequest request) {
        
        SendMoneyResponse response = paymentService.processTransfer(userPrincipal.getId(), request);
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Payment completed successfully", response));
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate Payment Request", description = "Executes dry-run checks for sender/receiver status, limits, and available balance before sending.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<PaymentValidationResponse>> validatePayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody SendMoneyRequest request) {
        
        PaymentValidationResponse response = paymentService.validateTransferRequest(userPrincipal.getId(), request);
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Validation dry-run completed", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Transaction Details", description = "Retrieves metadata of a specific payment transaction. Authorized for sender/receiver only.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<TransactionDetailsResponse>> getTransactionDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        TransactionDetailsResponse details = transactionService.getTransactionDetails(id, userPrincipal.getId());
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Transaction details retrieved successfully", details));
    }

    @GetMapping("/history")
    @Operation(summary = "Get Transaction History", description = "Retrieves a paginated list of all transaction histories for the authenticated user.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<TransactionHistoryResponse>> getHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // Sorting by createdAt desc
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        TransactionHistoryResponse history = transactionService.getTransactionHistory(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Transaction history retrieved successfully", history));
    }

    @GetMapping("/receipt/{id}")
    @Operation(summary = "Get Payment Receipt", description = "Generates details of printable transaction receipt for PDF compile compilation. Authorized for sender/receiver only.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<PaymentReceiptResponse>> getReceipt(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        
        PaymentReceiptResponse receipt = receiptService.getReceipt(id, userPrincipal.getId());
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Payment receipt retrieved successfully", receipt));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Cancel Pending Payment", description = "Simulates cancelling an authorization or processing block for pending payments.")
    public ResponseEntity<com.apexpay.dto.ApiResponse<String>> cancelPayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam UUID transactionId) {
        
        paymentService.cancelPayment(transactionId, userPrincipal.getId());
        return ResponseEntity.ok(com.apexpay.dto.ApiResponse.success("Payment cancelled successfully", null));
    }
}
