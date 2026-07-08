package com.apexpay.service;

import com.apexpay.dto.*;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for managing customer digital wallets and ledgers.
 */
public interface WalletService {
    WalletResponse getWallet(UUID userId);
    WalletBalanceResponse getBalance(UUID userId);
    WalletSummaryResponse getSummary(UUID userId);
    AddMoneyResponse addMoney(UUID userId, AddMoneyRequest request);
    WithdrawResponse withdraw(UUID userId, WithdrawRequest request);
    List<WalletLedgerResponse> getLedger(UUID userId);
    WalletAnalyticsResponse getAnalytics(UUID userId);
}
