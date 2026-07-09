package com.apexpay.entity;

import com.apexpay.entity.enums.BusinessVerificationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a registered Business Merchant.
 */
@Getter
@Setter
@Entity
@Table(name = "merchants")
public class Merchant extends BaseEntity {

    @NotBlank(message = "Business name is required")
    @Size(max = 255, message = "Business name must be less than 255 characters")
    @Column(name = "business_name", nullable = false)
    private String businessName;

    @NotBlank(message = "Business type is required")
    @Column(name = "business_type", nullable = false)
    private String businessType;

    @NotBlank(message = "Business email is required")
    @Email(message = "Please provide a valid business email")
    @Size(max = 150, message = "Business email must be less than 150 characters")
    @Column(name = "business_email", nullable = false, unique = true)
    private String businessEmail;

    @NotBlank(message = "Business mobile number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Please provide a valid mobile number")
    @Size(max = 20, message = "Mobile number must be less than 20 characters")
    @Column(name = "business_mobile", nullable = false, unique = true)
    private String businessMobile;

    @Size(max = 50, message = "GST number must be less than 50 characters")
    @Column(name = "gst_number", unique = true)
    private String gstNumber;

    @Size(max = 50, message = "PAN number must be less than 50 characters")
    @Column(name = "pan_number", unique = true)
    private String panNumber;

    @NotNull(message = "Owner is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @NotBlank(message = "Business address is required")
    @Column(name = "business_address", nullable = false, columnDefinition = "TEXT")
    private String businessAddress;

    @Size(max = 512, message = "Logo URL must be less than 512 characters")
    @Column(name = "business_logo")
    private String businessLogo;

    @NotNull(message = "Verification status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private BusinessVerificationStatus verificationStatus;

    @Column(name = "rejected_reason", length = 512)
    private String rejectedReason;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    // KYC Documents Mock Paths/URLs
    @Column(name = "pan_upload", length = 512)
    private String panUpload;

    @Column(name = "gst_upload", length = 512)
    private String gstUpload;

    @Column(name = "business_proof", length = 512)
    private String businessProof;

    @Column(name = "identity_proof", length = 512)
    private String identityProof;

    @Column(name = "address_proof", length = 512)
    private String addressProof;

    @OneToOne(mappedBy = "merchant", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private MerchantWallet wallet;

    @OneToMany(mappedBy = "merchant", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<MerchantEmployee> employees = new ArrayList<>();
}
