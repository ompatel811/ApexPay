package com.apexpay.service;

import com.apexpay.entity.Transaction;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service managing clean delegation of payment operations to Module 6 without duplication.
 */
public interface PaymentIntegrationService {
    Transaction delegateTransfer(UUID senderUserId, String recipientWalletNumber, BigDecimal amount, 
                                 String remarks, String idempotencyKey);
}
