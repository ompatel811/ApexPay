package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing user Wallet details.
 */
public record WalletResponse(
        UUID id,
        String walletNumber,
        BigDecimal availableBalance,
        String currency,
        String walletStatus,
        BigDecimal dailyTransferLimit,
        BigDecimal dailyWithdrawalLimit,
        BigDecimal monthlyTransferLimit,
        BigDecimal monthlyWithdrawalLimit,
        LocalDateTime createdDate
) {}
