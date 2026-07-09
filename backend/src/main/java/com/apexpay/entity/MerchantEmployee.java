package com.apexpay.entity;

import com.apexpay.entity.enums.EmployeeStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing an employee mapping under a merchant business.
 */
@Getter
@Setter
@Entity
@Table(name = "merchant_employees", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"merchant_id", "user_id"})
})
public class MerchantEmployee extends BaseEntity {

    @NotNull(message = "Merchant is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Role is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private MerchantRole role;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EmployeeStatus status = EmployeeStatus.INVITED;
}
