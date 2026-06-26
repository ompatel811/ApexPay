package com.apexpay.entity;

import com.apexpay.entity.enums.BankAccountType;
import com.apexpay.entity.enums.VerificationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing an attached external Bank Account.
 */
@Getter
@Setter
@Entity
@Table(name = "bank_accounts")
public class BankAccount extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Bank name is required")
    @Size(max = 150, message = "Bank name must be less than 150 characters")
    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @NotBlank(message = "Account holder name is required")
    @Size(max = 255, message = "Account holder name must be less than 255 characters")
    @Column(name = "account_holder_name", nullable = false)
    private String accountHolderName;

    @NotBlank(message = "Account number is required")
    @Size(max = 100, message = "Account number must be less than 100 characters")
    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @NotBlank(message = "IFSC code is required")
    @Size(max = 50, message = "IFSC code must be less than 50 characters")
    @Column(name = "ifsc", nullable = false)
    private String ifsc;

    @NotNull(message = "Account type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private BankAccountType accountType;

    @NotNull(message = "isPrimary flag is required")
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @NotNull(message = "Verification status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus;
}
