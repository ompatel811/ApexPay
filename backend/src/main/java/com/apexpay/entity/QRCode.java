package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing an generated QR code.
 */
@Getter
@Setter
@Entity
@Table(name = "qr_codes")
public class QRCode extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "QR code value is required")
    @Size(max = 512, message = "QR value must be less than 512 characters")
    @Column(name = "qr_value", nullable = false)
    private String qrValue;

    @NotBlank(message = "QR code type is required")
    @Size(max = 50, message = "QR type must be less than 50 characters")
    @Column(name = "qr_type", nullable = false)
    private String qrType;

    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;

    @Column(name = "qr_data", columnDefinition = "TEXT")
    private String qrData;

    @Size(max = 100, message = "Reference number must be less than 100 characters")
    @Column(name = "reference_number")
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;

    @Column(name = "amount", precision = 15, scale = 4)
    private BigDecimal amount;

    @Size(max = 10, message = "Currency string must be less than 10 characters")
    @Column(name = "currency")
    private String currency;

    @NotBlank(message = "QR status is required")
    @Size(max = 50, message = "QR status must be less than 50 characters")
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
}
