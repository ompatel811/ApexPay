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

    @OneToMany(mappedBy = "senderWallet", fetch = FetchType.LAZY)
    private List<Transaction> sentTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "receiverWallet", fetch = FetchType.LAZY)
    private List<Transaction> receivedTransactions = new ArrayList<>();
}
