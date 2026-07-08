package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entity representing a savings Financial Goal.
 */
@Getter
@Setter
@Entity
@Table(name = "financial_goals")
public class FinancialGoal extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Goal name is required")
    @Size(max = 150, message = "Goal name must be less than 150 characters")
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull(message = "Target amount is required")
    @DecimalMin(value = "0.01", message = "Target amount must be positive")
    @Column(name = "target_amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal targetAmount;

    @NotNull(message = "Current amount is required")
    @Column(name = "current_amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal currentAmount = BigDecimal.ZERO;

    @NotNull(message = "Target date is required")
    @Future(message = "Target date must be in the future")
    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @NotBlank(message = "Status is required")
    @Column(name = "status", nullable = false)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED
}
