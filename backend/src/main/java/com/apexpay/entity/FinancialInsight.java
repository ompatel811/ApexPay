package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a smart financial insight generated for a user.
 */
@Getter
@Setter
@Entity
@Table(name = "financial_insights")
public class FinancialInsight extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Insight type is required")
    @Size(max = 50, message = "Type must be less than 50 characters")
    @Column(name = "type", nullable = false)
    private String type; // DAILY, WEEKLY, MONTHLY, SPENDING, GENERAL

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be less than 255 characters")
    @Column(name = "title", nullable = false)
    private String title;

    @NotBlank(message = "Description is required")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
}
