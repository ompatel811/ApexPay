package com.apexpay.entity;

import com.apexpay.entity.enums.PaymentLinkStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a merchant payment link generated to receive customer payments.
 */
@Getter
@Setter
@Entity
@Table(name = "payment_links")
public class PaymentLink extends BaseEntity {

    @NotNull(message = "Merchant reference is required")
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

    @NotNull(message = "Expiry date is required")
    @Column(name = "expiry", nullable = false)
    private LocalDateTime expiry;

    @Column(name = "description", length = 255)
    private String description;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentLinkStatus status = PaymentLinkStatus.PENDING;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "customer_email", length = 150)
    private String customerEmail;

    @Column(name = "customer_mobile", length = 20)
    private String customerMobile;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;
}
