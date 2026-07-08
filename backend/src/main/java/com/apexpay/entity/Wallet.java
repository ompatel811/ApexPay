package com.apexpay.entity;

import com.apexpay.entity.enums.WalletStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a customer Digital Wallet.
 */
@Getter
@Setter
@Entity
@Table(name = "wallets")
public class Wallet extends BaseEntity {

    @NotNull(message = "User association is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotBlank(message = "Wallet number is required")
    @Size(max = 50, message = "Wallet number must be less than 50 characters")
    @Column(name = "wallet_number", nullable = false, unique = true)
    private String walletNumber;

    @NotNull(message = "Balance is required")
    @DecimalMin(value = "0.0", message = "Balance cannot be negative")
    @Digits(integer = 11, fraction = 4, message = "Balance exceeds format limitations")
    @Column(name = "balance", nullable = false, precision = 15, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @NotBlank(message = "Currency is required")
    @Size(max = 10, message = "Currency string must be less than 10 characters")
    @Column(name = "currency", nullable = false)
    private String currency = "USD";

    @NotNull(message = "Wallet status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "wallet_status", nullable = false)
    private WalletStatus walletStatus;

    @NotNull(message = "Daily transfer limit is required")
    @DecimalMin(value = "0.0", message = "Limit cannot be negative")
    @Column(name = "daily_transfer_limit", nullable = false, precision = 15, scale = 4)
    private BigDecimal dailyTransferLimit = new BigDecimal("1000.0000");

    @NotNull(message = "Daily withdrawal limit is required")
    @DecimalMin(value = "0.0", message = "Limit cannot be negative")
    @Column(name = "daily_withdrawal_limit", nullable = false, precision = 15, scale = 4)
    private BigDecimal dailyWithdrawalLimit = new BigDecimal("500.0000");

    @NotNull(message = "Monthly transfer limit is required")
    @DecimalMin(value = "0.0", message = "Limit cannot be negative")
    @Column(name = "monthly_transfer_limit", nullable = false, precision = 15, scale = 4)
    private BigDecimal monthlyTransferLimit = new BigDecimal("5000.0000");

    @NotNull(message = "Monthly withdrawal limit is required")
    @DecimalMin(value = "0.0", message = "Limit cannot be negative")
    @Column(name = "monthly_withdrawal_limit", nullable = false, precision = 15, scale = 4)
    private BigDecimal monthlyWithdrawalLimit = new BigDecimal("2500.0000");

    @OneToMany(mappedBy = "senderWallet", fetch = FetchType.LAZY)
    private List<Transaction> sentTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "receiverWallet", fetch = FetchType.LAZY)
    private List<Transaction> receivedTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<WalletLedger> ledgerEntries = new ArrayList<>();
}
