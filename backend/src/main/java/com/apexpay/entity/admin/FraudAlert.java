package com.apexpay.entity.admin;

import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.User;
import com.apexpay.entity.Merchant;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "fraud_alerts")
public class FraudAlert {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "merchant_id")
    private Merchant merchant;

    @NotNull(message = "Risk score is required")
    @Column(name = "risk_score", nullable = false)
    private int riskScore;

    @NotBlank(message = "Risk level is required")
    @Size(max = 50)
    @Column(name = "risk_level", nullable = false)
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    @NotBlank(message = "Reason is required")
    @Size(max = 255)
    @Column(name = "reason", nullable = false)
    private String reason;

    @NotBlank(message = "Action is required")
    @Size(max = 50)
    @Column(name = "action", nullable = false)
    private String action = "ALLOW"; // ALLOW, REVIEW, BLOCK, FREEZE_WALLET, FREEZE_USER, FREEZE_MERCHANT

    @NotBlank(message = "Status is required")
    @Size(max = 50)
    @Column(name = "status", nullable = false)
    private String status = "PENDING_REVIEW"; // PENDING_REVIEW, INVESTIGATING, CLOSED_RESOLVED, CLOSED_FALSE_POSITIVE

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
