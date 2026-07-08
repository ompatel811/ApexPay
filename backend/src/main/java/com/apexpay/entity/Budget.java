package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/**
 * Entity representing a categorical Monthly Budget.
 */
@Getter
@Setter
@Entity
@Table(name = "budgets")
public class Budget extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be less than 50 characters")
    @Column(name = "category", nullable = false)
    private String category;

    @NotNull(message = "Amount limit is required")
    @DecimalMin(value = "0.01", message = "Amount limit must be positive")
    @Column(name = "amount_limit", nullable = false, precision = 15, scale = 4)
    private BigDecimal amountLimit;

    @NotNull(message = "Spent amount is required")
    @Column(name = "spent", nullable = false, precision = 15, scale = 4)
    private BigDecimal spent = BigDecimal.ZERO;

    @NotBlank(message = "Month is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Month must be in YYYY-MM format")
    @Column(name = "month", nullable = false)
    private String month;
}
