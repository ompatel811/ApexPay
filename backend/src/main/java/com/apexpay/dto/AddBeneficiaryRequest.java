package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO representing request to add a new peer Beneficiary.
 */
public record AddBeneficiaryRequest(
        @NotBlank(message = "Recipient identifier is required")
        String recipientIdentifier, // Username, email, phone, or wallet number of the contact

        @Size(max = 100, message = "Nickname must be less than 100 characters")
        String nickname
) {}
