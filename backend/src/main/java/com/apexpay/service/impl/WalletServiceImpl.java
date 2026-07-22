package com.apexpay.service.impl;

import com.apexpay.dto.*;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.WalletLedger;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.WalletLedgerRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation managing user digital wallets, balance updates, limits checks, and immutable auditing ledgers.
 */
@Service
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final AuditService auditService;

    public WalletServiceImpl(WalletRepository walletRepository,
                             WalletLedgerRepository walletLedgerRepository,
                             AuditService auditService) {
        this.walletRepository = walletRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWallet(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));
        return mapToWalletResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletBalanceResponse getBalance(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));
        return new WalletBalanceResponse(wallet.getBalance(), wallet.getCurrency());
    }

    @Override
    @Transactional(readOnly = true)
    public WalletSummaryResponse getSummary(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        LocalDateTime startOfToday = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);

        List<WalletLedger> todayEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(wallet.getId(), startOfToday);
        List<WalletLedger> monthEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(wallet.getId(), startOfMonth);

        BigDecimal dailySpentToday = todayEntries.stream()
                .filter(e -> "WITHDRAWAL".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlySpentThisMonth = monthEntries.stream()
                .filter(e -> "WITHDRAWAL".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyCredits = monthEntries.stream()
                .filter(e -> "ADD_MONEY".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyDebits = monthlySpentThisMonth;

        return new WalletSummaryResponse(monthlyCredits, monthlyDebits, dailySpentToday, monthlySpentThisMonth);
    }

    @Override
    @Transactional
    public AddMoneyResponse addMoney(UUID userId, AddMoneyRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        if (wallet.getWalletStatus() != WalletStatus.ACTIVE) {
            throw new BusinessException("Wallet is not active. Status: " + wallet.getWalletStatus());
        }

        BigDecimal amount = request.amount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount to add must be positive and greater than zero.");
        }

        // Apply a high cap for simulation protection (e.g. $10,000 max single add)
        BigDecimal maxSingleAdd = new BigDecimal("10000.0000");
        if (amount.compareTo(maxSingleAdd) > 0) {
            throw new BusinessException("Simulated single top-up cannot exceed " + maxSingleAdd + " " + wallet.getCurrency());
        }

        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal balanceAfter = balanceBefore.add(amount);

        // Update Wallet Balance
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        // Generate Transaction Reference
        String reference = "APX" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        // Save Ledger record
        WalletLedger ledger = new WalletLedger();
        ledger.setWallet(wallet);
        ledger.setReferenceNumber(reference);
        ledger.setTransactionType("ADD_MONEY");
        ledger.setAmount(amount);
        ledger.setBalanceBefore(balanceBefore);
        ledger.setBalanceAfter(balanceAfter);
        ledger.setTimestamp(LocalDateTime.now());
        ledger.setRemarks("Add money: " + (request.fundingSource() != null ? request.fundingSource() : "Bank Account"));
        ledger.setStatus("SUCCESS");

        walletLedgerRepository.save(ledger);

        // Audit Log
        auditService.log("WALLET_ADD_MONEY", userId, "Wallet", wallet.getId());

        return new AddMoneyResponse(
                reference,
                amount,
                balanceAfter,
                ledger.getTimestamp(),
                "SUCCESS",
                ledger.getRemarks()
        );
    }

    @Override
    @Transactional
    public WithdrawResponse withdraw(UUID userId, WithdrawRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        if (wallet.getWalletStatus() != WalletStatus.ACTIVE) {
            throw new BusinessException("Wallet is not active. Status: " + wallet.getWalletStatus());
        }

        BigDecimal amount = request.amount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Withdrawal amount must be positive.");
        }

        // 1. Check Available Balance
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient wallet balance.");
        }

        // 2. Validate Daily Withdrawal Limit
        LocalDateTime startOfToday = LocalDateTime.now().with(LocalTime.MIN);
        List<WalletLedger> todayEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(wallet.getId(), startOfToday);
        BigDecimal todayWithdrawals = todayEntries.stream()
                .filter(e -> "WITHDRAWAL".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (todayWithdrawals.add(amount).compareTo(wallet.getDailyWithdrawalLimit()) > 0) {
            throw new BusinessException("Daily withdrawal limit exceeded. Limit remaining: " + 
                    wallet.getDailyWithdrawalLimit().subtract(todayWithdrawals));
        }

        // 3. Validate Monthly Withdrawal Limit
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);
        List<WalletLedger> monthEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(wallet.getId(), startOfMonth);
        BigDecimal monthlyWithdrawals = monthEntries.stream()
                .filter(e -> "WITHDRAWAL".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (monthlyWithdrawals.add(amount).compareTo(wallet.getMonthlyWithdrawalLimit()) > 0) {
            throw new BusinessException("Monthly withdrawal limit exceeded. Limit remaining: " + 
                    wallet.getMonthlyWithdrawalLimit().subtract(monthlyWithdrawals));
        }

        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal balanceAfter = balanceBefore.subtract(amount);

        // Update Wallet Balance
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        // Generate Transaction Reference
        String reference = "APX" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        // Save Ledger Record
        WalletLedger ledger = new WalletLedger();
        ledger.setWallet(wallet);
        ledger.setReferenceNumber(reference);
        ledger.setTransactionType("WITHDRAWAL");
        ledger.setAmount(amount);
        ledger.setBalanceBefore(balanceBefore);
        ledger.setBalanceAfter(balanceAfter);
        ledger.setTimestamp(LocalDateTime.now());
        ledger.setRemarks("Withdrawal to linked funding bank");
        ledger.setStatus("SUCCESS");

        walletLedgerRepository.save(ledger);

        // Audit Log
        auditService.log("WALLET_WITHDRAW", userId, "Wallet", wallet.getId());

        return new WithdrawResponse(
                reference,
                amount,
                balanceAfter,
                ledger.getTimestamp(),
                "SUCCESS",
                ledger.getRemarks()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletLedgerResponse> getLedger(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        return walletLedgerRepository.findByWalletIdOrderByTimestampDesc(wallet.getId())
                .stream()
                .map(this::mapToLedgerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WalletAnalyticsResponse getAnalytics(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        List<WalletLedger> allEntries = walletLedgerRepository.findByWalletIdOrderByTimestampDesc(wallet.getId());

        BigDecimal totalCredits = allEntries.stream()
                .filter(e -> "ADD_MONEY".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDebits = allEntries.stream()
                .filter(e -> "WITHDRAWAL".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);
        List<WalletLedger> monthEntries = allEntries.stream()
                .filter(e -> e.getTimestamp().isAfter(startOfMonth))
                .collect(Collectors.toList());

        BigDecimal monthlyCredits = monthEntries.stream()
                .filter(e -> "ADD_MONEY".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyDebits = monthEntries.stream()
                .filter(e -> "WITHDRAWAL".equalsIgnoreCase(e.getTransactionType()) && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WalletLedger> successfulEntries = allEntries.stream()
                .filter(e -> "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .collect(Collectors.toList());

        BigDecimal averageTransactionAmount = BigDecimal.ZERO;
        if (!successfulEntries.isEmpty()) {
            BigDecimal sum = successfulEntries.stream()
                    .map(WalletLedger::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            averageTransactionAmount = sum.divide(BigDecimal.valueOf(successfulEntries.size()), 4, RoundingMode.HALF_UP);
        }

        BigDecimal largestTransaction = successfulEntries.stream()
                .map(WalletLedger::getAmount)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);

        return new WalletAnalyticsResponse(
                totalCredits,
                totalDebits,
                monthlyCredits,
                monthlyDebits,
                averageTransactionAmount,
                largestTransaction
        );
    }

    private WalletResponse mapToWalletResponse(Wallet wallet) {
        return new WalletResponse(
                wallet.getId(),
                wallet.getWalletNumber(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getWalletStatus().name(),
                wallet.getDailyTransferLimit(),
                wallet.getDailyWithdrawalLimit(),
                wallet.getMonthlyTransferLimit(),
                wallet.getMonthlyWithdrawalLimit(),
                wallet.getCreatedAt()
        );
    }

    private WalletLedgerResponse mapToLedgerResponse(WalletLedger ledger) {
        return new WalletLedgerResponse(
                ledger.getId(),
                ledger.getReferenceNumber(),
                ledger.getTransactionType(),
                ledger.getAmount(),
                ledger.getBalanceBefore(),
                ledger.getBalanceAfter(),
                ledger.getTimestamp(),
                ledger.getRemarks(),
                ledger.getStatus()
        );
    }
}
