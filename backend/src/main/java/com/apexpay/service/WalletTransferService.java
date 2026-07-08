package com.apexpay.service;

import com.apexpay.entity.Transaction;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service managing strict database-level wallet debit/credit and locks.
 */
public interface WalletTransferService {
    Transaction executeTransfer(UUID senderWalletId, UUID receiverWalletId, BigDecimal amount, String remarks);
}
