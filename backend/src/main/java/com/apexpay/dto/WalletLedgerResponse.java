package com.apexpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing an entry in the Wallet Ledger.
 */
public record WalletLedgerResponse(
        UUID id,
        String referenceNumber,
        String transactionType,
        BigDecimal amount,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        LocalDateTime timestamp,
        String remarks,
        String status
) {}
