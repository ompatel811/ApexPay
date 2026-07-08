package com.apexpay.dto;

import java.util.UUID;

/**
 * DTO representing beneficiary details.
 */
public record BeneficiaryResponse(
        UUID id,
        String nickname,
        String upiId,
        String mobileNumber,
        String fullName,
        String walletNumber,
        UUID recipientUserId
) {}
