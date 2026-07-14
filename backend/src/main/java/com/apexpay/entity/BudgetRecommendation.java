package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/**
 * Entity representing an AI budget recommendation.
 */
@Getter
@Setter
@Entity
@Table(name = "budget_recommendations")
public class BudgetRecommendation extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be less than 50 characters")
    @Column(name = "category", nullable = false)
    private String category;

    @NotNull(message = "Recommended amount is required")
    @DecimalMin(value = "0.01", message = "Recommended amount must be positive")
    @Column(name = "recommended_amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal recommendedAmount;

    @NotNull(message = "Current spending is required")
    @Column(name = "current_spending", nullable = false, precision = 15, scale = 4)
    private BigDecimal currentSpending = BigDecimal.ZERO;

    @NotBlank(message = "Reasoning description is required")
    @Column(name = "reasoning", nullable = false, columnDefinition = "TEXT")
    private String reasoning;

    @NotNull(message = "Applied status is required")
    @Column(name = "is_applied", nullable = false)
    private Boolean isApplied = false;
}
