package com.apexpay.entity;

import com.apexpay.entity.enums.SettlementStatus;
import com.apexpay.entity.enums.SettlementType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing periodic settlements generated for a merchant business.
 */
@Getter
@Setter
@Entity
@Table(name = "settlements")
public class Settlement extends BaseEntity {

    @NotNull(message = "Merchant is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @NotBlank(message = "Reference number is required")
    @Column(name = "reference_number", nullable = false, unique = true, length = 100)
    private String referenceNumber;

    @NotNull(message = "Amount is required")
    @Column(name = "amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "USD";

    @NotNull(message = "Settlement type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_type", nullable = false)
    private SettlementType settlementType;

    @NotNull(message = "Settlement status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SettlementStatus status = SettlementStatus.PENDING;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;
}
