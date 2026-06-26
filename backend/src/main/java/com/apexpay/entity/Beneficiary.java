package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a saved peer Beneficiary.
 */
@Getter
@Setter
@Entity
@Table(name = "beneficiaries")
public class Beneficiary extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Size(max = 100, message = "Nickname must be less than 100 characters")
    @Column(name = "nickname")
    private String nickname;

    @NotBlank(message = "UPI ID is required")
    @Size(max = 100, message = "UPI ID must be less than 100 characters")
    @Column(name = "upi_id", nullable = false)
    private String upiId;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Please provide a valid mobile number in E.164 format")
    @Size(max = 20, message = "Mobile number must be less than 20 characters")
    @Column(name = "mobile_number")
    private String mobileNumber;
}
