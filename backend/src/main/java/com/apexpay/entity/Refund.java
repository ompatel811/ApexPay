package com.apexpay.entity;

import com.apexpay.entity.enums.RefundStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Entity representing a merchant refund request linked to a wallet transaction.
 */
@Getter
@Setter
@Entity
@Table(name = "refunds")
public class Refund extends BaseEntity {

    @NotNull(message = "Merchant is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @NotNull(message = "Transaction reference is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @NotNull(message = "Amount is required")
    @Column(name = "amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal amount;

    @Column(name = "reason", length = 255)
    private String reason;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RefundStatus status = RefundStatus.PENDING;

    @Column(name = "rejected_reason", length = 255)
    private String rejectedReason;
}
