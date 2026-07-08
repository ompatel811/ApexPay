package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/**
 * Entity representing a UPI Request (Collect Money Request).
 */
@Getter
@Setter
@Entity
@Table(name = "upi_requests")
public class UpiRequest extends BaseEntity {

    @NotNull(message = "Requester association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @NotNull(message = "Payer association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @NotBlank(message = "Requester UPI ID is required")
    @Column(name = "requester_upi", nullable = false)
    private String requesterUpi;

    @NotBlank(message = "Payer UPI ID is required")
    @Column(name = "payer_upi", nullable = false)
    private String payerUpi;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Column(name = "amount", nullable = false, precision = 15, scale = 4)
    private BigDecimal amount;

    @Size(max = 255, message = "Remarks must be less than 255 characters")
    @Column(name = "remarks")
    private String remarks;

    @NotBlank(message = "Status is required")
    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED
}
