package com.apexpay.entity;

import com.apexpay.entity.enums.WalletStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Entity representing a Business Wallet for a Merchant.
 */
@Getter
@Setter
@Entity
@Table(name = "merchant_wallets")
public class MerchantWallet extends BaseEntity {

    @NotNull(message = "Merchant reference is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @NotBlank(message = "Wallet number is required")
    @Column(name = "wallet_number", nullable = false, unique = true, length = 50)
    private String walletNumber;

    @NotNull(message = "Balance is required")
    @Column(name = "balance", nullable = false, precision = 15, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @NotBlank(message = "Currency is required")
    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @NotNull(message = "Wallet status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "wallet_status", nullable = false)
    private WalletStatus walletStatus = WalletStatus.ACTIVE;
}
