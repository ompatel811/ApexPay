package com.apexpay.dto;

import com.apexpay.entity.enums.BankAccountType;
import com.apexpay.entity.enums.VerificationStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record BankAccountResponse(
    UUID id,
    String bankName,
    String accountHolderName,
    String accountNumber,
    String maskedAccountNumber,
    String ifsc,
    String branch,
    BankAccountType accountType,
    boolean isPrimary,
    VerificationStatus verificationStatus,
    LocalDateTime createdAt
) {}
