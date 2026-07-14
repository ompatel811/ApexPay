package com.apexpay.controller.admin;

import com.apexpay.dto.ApiResponse;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.service.admin.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Admin Transaction Management", description = "Endpoints for auditing payments, triggering refunds, and downloading receipts")
public class AdminTransactionController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_TRANSACTIONS')")
    @Operation(summary = "Get all transactions", description = "Retrieves all wallet, UPI, and QR payments across users")
    public ResponseEntity<ApiResponse<List<Transaction>>> getAllTransactions() {
        return ResponseEntity.ok(ApiResponse.success("Transactions list retrieved successfully", transactionRepository.findAll()));
    }

    @PutMapping("/transactions/{id}/approve")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_TRANSACTIONS')")
    @Operation(summary = "Force approve transaction", description = "Forcibly transitions transaction state to SUCCESS")
    public ResponseEntity<ApiResponse<Transaction>> approveTransaction(@PathVariable UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        transaction.setPaymentStatus(TransactionStatus.SUCCESS);
        transaction = transactionRepository.save(transaction);
        return ResponseEntity.ok(ApiResponse.success("Transaction force-approved successfully", transaction));
    }

    @PutMapping("/transactions/{id}/reverse")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_TRANSACTIONS')")
    @Operation(summary = "Reverse transaction", description = "Performs transaction reversal and wallet adjustments")
    public ResponseEntity<ApiResponse<Transaction>> reverseTransaction(@PathVariable UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        
        // Adjust sender and receiver balances
        if (transaction.getSenderWallet() != null) {
            adminService.adjustWalletBalance(transaction.getSenderWallet().getId(), transaction.getAmount(), "Reversal of " + transaction.getTransactionReference());
        }
        if (transaction.getReceiverWallet() != null) {
            adminService.adjustWalletBalance(transaction.getReceiverWallet().getId(), transaction.getAmount().negate(), "Reversal of " + transaction.getTransactionReference());
        }
        
        transaction.setPaymentStatus(TransactionStatus.FAILED);
        transaction.setRemarks("Reversal triggered by administrator");
        transaction = transactionRepository.save(transaction);

        return ResponseEntity.ok(ApiResponse.success("Transaction reversed successfully", transaction));
    }

    @PutMapping("/transactions/{id}/cancel")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_TRANSACTIONS')")
    @Operation(summary = "Cancel transaction", description = "Updates transaction status to FAILED or CANCELLED")
    public ResponseEntity<ApiResponse<Transaction>> cancelTransaction(@PathVariable UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        transaction.setPaymentStatus(TransactionStatus.FAILED);
        transaction = transactionRepository.save(transaction);
        return ResponseEntity.ok(ApiResponse.success("Transaction cancelled successfully", transaction));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAuthority('PERMISSION_MANAGE_REPORTS')")
    @Operation(summary = "Download reports", description = "Generates and exports platform logs in CSV, Excel, or PDF format")
    public ResponseEntity<byte[]> downloadReport(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(defaultValue = "transactions") String type) {
        
        byte[] data = adminService.generateReport(format, type);
        
        String filename = "report_" + type + "_" + System.currentTimeMillis() + "." + format;
        MediaType mediaType = format.equalsIgnoreCase("pdf") ? MediaType.APPLICATION_PDF : MediaType.TEXT_PLAIN;
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(mediaType)
                .body(data);
    }
}
