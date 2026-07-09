package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record MerchantProfileResponse(
    UUID id,
    String businessName,
    String businessType,
    String businessEmail,
    String businessMobile,
    String gstNumber,
    String panNumber,
    UUID ownerId,
    String ownerName,
    String businessAddress,
    String businessLogo,
    String verificationStatus,
    String rejectedReason,
    LocalDateTime approvedDate,
    String panUpload,
    String gstUpload,
    String businessProof,
    String identityProof,
    String addressProof,
    String walletNumber,
    BigDecimal walletBalance,
    String walletCurrency,
    LocalDateTime createdAt
) {}
