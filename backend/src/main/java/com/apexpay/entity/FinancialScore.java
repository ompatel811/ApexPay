package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/**
 * Entity representing a user's Financial Health Score details.
 */
@Getter
@Setter
@Entity
@Table(name = "financial_scores")
public class FinancialScore extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be at least 0")
    @Max(value = 100, message = "Score cannot exceed 100")
    @Column(name = "score", nullable = false)
    private Integer score;

    @NotNull(message = "Savings rate is required")
    @Column(name = "savings_rate", nullable = false, precision = 15, scale = 4)
    private BigDecimal savingsRate = BigDecimal.ZERO;

    @NotNull(message = "Budget adherence is required")
    @Column(name = "budget_adherence", nullable = false, precision = 15, scale = 4)
    private BigDecimal budgetAdherence = BigDecimal.ZERO;

    @NotBlank(message = "Bill payment history summary is required")
    @Size(max = 255, message = "Bill payment history must be less than 255 characters")
    @Column(name = "bill_payment_history", nullable = false)
    private String billPaymentHistory; // e.g. EXCELLENT, GOOD, POOR

    @NotBlank(message = "Factor breakdown detail is required")
    @Column(name = "factor_breakdown", nullable = false, columnDefinition = "TEXT")
    private String factorBreakdown;
}
