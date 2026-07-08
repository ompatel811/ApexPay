package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing an immutable ledger record for a Wallet transaction.
 */
@Getter
@Setter
@Entity
@Table(name = "wallet_ledgers")
public class WalletLedger {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Wallet association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false, updatable = false)
    private Wallet wallet;

    @NotBlank(message = "Reference number is required")
    @Size(max = 100, message = "Reference number must be less than 100 characters")
    @Column(name = "reference_number", nullable = false, updatable = false)
    private String referenceNumber;

    @NotBlank(message = "Transaction type is required")
    @Size(max = 50, message = "Transaction type must be less than 50 characters")
    @Column(name = "transaction_type", nullable = false, updatable = false)
    private String transactionType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0001", message = "Amount must be positive")
    @Column(name = "amount", nullable = false, precision = 15, scale = 4, updatable = false)
    private BigDecimal amount;

    @NotNull(message = "Balance before is required")
    @Column(name = "balance_before", nullable = false, precision = 15, scale = 4, updatable = false)
    private BigDecimal balanceBefore;

    @NotNull(message = "Balance after is required")
    @Column(name = "balance_after", nullable = false, precision = 15, scale = 4, updatable = false)
    private BigDecimal balanceAfter;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Size(max = 255, message = "Remarks must be less than 255 characters")
    @Column(name = "remarks", updatable = false)
    private String remarks;

    @NotBlank(message = "Status is required")
    @Size(max = 50, message = "Status must be less than 50 characters")
    @Column(name = "status", nullable = false, updatable = false)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", updatable = false)
    private Transaction transaction;

    @NotBlank(message = "Direction is required")
    @Size(max = 10, message = "Direction must be less than 10 characters")
    @Column(name = "direction", nullable = false, updatable = false)
    private String direction = "DEBIT";
}
