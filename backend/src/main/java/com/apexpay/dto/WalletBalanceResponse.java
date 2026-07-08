package com.apexpay.dto;

import java.math.BigDecimal;

/**
 * DTO representing user Wallet balance only.
 */
public record WalletBalanceResponse(
        BigDecimal availableBalance,
        String currency
) {}
