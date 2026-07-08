package com.apexpay.service;

import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import java.math.BigDecimal;

/**
 * Service managing double-entry wallet ledger creation.
 */
public interface LedgerService {
    void createLedgerEntries(Transaction transaction, Wallet sender, Wallet receiver, BigDecimal amount);
}
