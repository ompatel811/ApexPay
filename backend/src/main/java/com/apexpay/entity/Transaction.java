package com.apexpay.entity;

import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Entity representing a platform payment Transaction.
 */
@Getter
@Setter
@Entity
@Table(name = "transactions")
public class Transaction extends BaseEntity {

    @NotBlank(message = "Transaction reference is required")
    @Size(max = 100, message = "Transaction reference must be less than 100 characters")
    @Column(name = "transaction_reference", nullable = false, unique = true)
    private String transactionReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_wallet_id")
    private Wallet senderWallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_wallet_id")
    private Wallet receiverWallet;

    @NotNull(message = "Transaction amount is required")
    @DecimalMin(value = "0.0001", message = "Transaction amount must be positive and greater than zero")
    @Digits(integer = 11, fraction = 4, message = "Amount exceeds formatting limitations")
    @Column(name = "amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal amount;

    @NotNull(message = "Transaction type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @NotNull(message = "Payment method is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private TransactionStatus paymentStatus;

    @NotBlank(message = "Transaction category is required")
    @Size(max = 50, message = "Category must be less than 50 characters")
    @Column(name = "category", nullable = false)
    private String category = "OTHER";

    @Size(max = 255, message = "Remarks must be less than 255 characters")
    @Column(name = "remarks")
    private String remarks;
}
