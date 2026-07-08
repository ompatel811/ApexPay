package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a User's UPI ID.
 */
@Getter
@Setter
@Entity
@Table(name = "upi_ids")
public class UpiId extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "UPI ID is required")
    @Size(max = 100, message = "UPI ID must be less than 100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9.\\-_]+@apexpay$", message = "UPI ID must be in the format username@apexpay")
    @Column(name = "upi_id", nullable = false, unique = true)
    private String upiId;

    @NotNull(message = "isPrimary flag is required")
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @NotBlank(message = "Status is required")
    @Size(max = 50, message = "Status must be less than 50 characters")
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
}
