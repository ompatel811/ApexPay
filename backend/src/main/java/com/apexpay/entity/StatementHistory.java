package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/**
 * Entity representing account statements history records.
 */
@Getter
@Setter
@Entity
@Table(name = "statement_history")
public class StatementHistory extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Statement period is required")
    @Column(name = "statement_period", nullable = false)
    private String statementPeriod;

    @NotNull(message = "Opening balance is required")
    @Column(name = "opening_balance", nullable = false, precision = 15, scale = 4)
    private BigDecimal openingBalance;

    @NotNull(message = "Closing balance is required")
    @Column(name = "closing_balance", nullable = false, precision = 15, scale = 4)
    private BigDecimal closingBalance;

    @NotNull(message = "Credits sum is required")
    @Column(name = "credits", nullable = false, precision = 15, scale = 4)
    private BigDecimal credits;

    @NotNull(message = "Debits sum is required")
    @Column(name = "debits", nullable = false, precision = 15, scale = 4)
    private BigDecimal debits;
}
