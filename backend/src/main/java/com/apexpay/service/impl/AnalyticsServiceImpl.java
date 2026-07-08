package com.apexpay.service.impl;

import com.apexpay.dto.*;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UpiRequestRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final UpiRequestRepository upiRequestRepository;

    @Autowired
    public AnalyticsServiceImpl(TransactionRepository transactionRepository,
                                WalletRepository walletRepository,
                                UpiRequestRepository upiRequestRepository) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.upiRequestRepository = upiRequestRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDashboardResponse getDashboardMetrics(UUID userId) {
        log.info("Aggregating dashboard metrics for user: {}", userId);

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found."));

        List<Transaction> allTxs = transactionRepository.findAllTransactionsByUserId(userId);
        List<Transaction> successTxs = allTxs.stream()
                .filter(t -> t.getPaymentStatus() == TransactionStatus.SUCCESS)
                .collect(Collectors.toList());

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal monthlyIncome = BigDecimal.ZERO;
        BigDecimal monthlyExpense = BigDecimal.ZERO;
        BigDecimal highestExpense = BigDecimal.ZERO;
        BigDecimal highestIncome = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Transaction tx : successTxs) {
            BigDecimal amt = tx.getAmount();
            boolean isDebit = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId);
            boolean isCredit = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(userId);

            if (isDebit) {
                if (tx.getCreatedAt().isAfter(startOfMonth)) {
                    monthlyExpense = monthlyExpense.add(amt);
                }
                if (amt.compareTo(highestExpense) > 0) {
                    highestExpense = amt;
                }
                totalAmount = totalAmount.add(amt);
            }
            
            if (isCredit) {
                if (tx.getCreatedAt().isAfter(startOfMonth)) {
                    monthlyIncome = monthlyIncome.add(amt);
                }
                if (amt.compareTo(highestIncome) > 0) {
                    highestIncome = amt;
                }
                totalAmount = totalAmount.add(amt);
            }
        }

        long totalTransactions = successTxs.size();
        BigDecimal averageTransaction = BigDecimal.ZERO;
        if (totalTransactions > 0) {
            // Average = sum(amount) / count (combining debits and credits)
            averageTransaction = totalAmount.divide(BigDecimal.valueOf(totalTransactions * 2L), 4, RoundingMode.HALF_UP);
        }

        long pendingPayments = upiRequestRepository.findByPayerIdAndStatus(userId, "PENDING").size();

        return new AnalyticsDashboardResponse(
                wallet.getBalance(),
                monthlyIncome,
                monthlyExpense,
                totalTransactions,
                averageTransaction,
                highestExpense,
                highestIncome,
                pendingPayments
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SpendingAnalyticsResponse getSpendingAnalytics(UUID userId) {
        log.info("Aggregating spending analytics for user: {}", userId);

        List<Transaction> txs = transactionRepository.findSuccessTransactionsByUserId(userId);
        
        List<Transaction> debits = txs.stream()
                .filter(t -> t.getSenderWallet() != null && t.getSenderWallet().getUser().getId().equals(userId))
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfYear = LocalDate.now().withDayOfYear(1).atStartOfDay();

        BigDecimal daily = BigDecimal.ZERO;
        BigDecimal weekly = BigDecimal.ZERO;
        BigDecimal monthly = BigDecimal.ZERO;
        BigDecimal yearly = BigDecimal.ZERO;

        BigDecimal highest = BigDecimal.ZERO;
        BigDecimal lowest = debits.isEmpty() ? BigDecimal.ZERO : debits.get(0).getAmount();
        BigDecimal total = BigDecimal.ZERO;

        Map<String, BigDecimal> categorySumMap = new HashMap<>();

        for (Transaction t : debits) {
            BigDecimal amt = t.getAmount();
            total = total.add(amt);

            if (t.getCreatedAt().isAfter(startOfToday)) daily = daily.add(amt);
            if (t.getCreatedAt().isAfter(startOfWeek)) weekly = weekly.add(amt);
            if (t.getCreatedAt().isAfter(startOfMonth)) monthly = monthly.add(amt);
            if (t.getCreatedAt().isAfter(startOfYear)) yearly = yearly.add(amt);

            if (amt.compareTo(highest) > 0) highest = amt;
            if (amt.compareTo(lowest) < 0) lowest = amt;

            String cat = t.getCategory();
            categorySumMap.put(cat, categorySumMap.getOrDefault(cat, BigDecimal.ZERO).add(amt));
        }

        BigDecimal average = debits.isEmpty() ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(debits.size()), 4, RoundingMode.HALF_UP);

        BigDecimal finalTotal = total;
        List<CategorySpendingItem> categoryBreakdown = categorySumMap.entrySet().stream()
                .map(entry -> {
                    BigDecimal pct = BigDecimal.ZERO;
                    if (finalTotal.compareTo(BigDecimal.ZERO) > 0) {
                        pct = entry.getValue().multiply(BigDecimal.valueOf(100)).divide(finalTotal, 2, RoundingMode.HALF_UP);
                    }
                    return new CategorySpendingItem(entry.getKey(), entry.getValue(), pct);
                })
                .sorted(Comparator.comparing(CategorySpendingItem::amount).reversed())
                .collect(Collectors.toList());

        return new SpendingAnalyticsResponse(
                daily, weekly, monthly, yearly,
                average, highest, lowest, categoryBreakdown
        );
    }

    @Override
    @Transactional(readOnly = true)
    public IncomeAnalyticsResponse getIncomeAnalytics(UUID userId) {
        log.info("Aggregating income analytics for user: {}", userId);

        List<Transaction> txs = transactionRepository.findSuccessTransactionsByUserId(userId);
        
        List<Transaction> credits = txs.stream()
                .filter(t -> t.getReceiverWallet() != null && t.getReceiverWallet().getUser().getId().equals(userId))
                .collect(Collectors.toList());

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfYear = LocalDate.now().withDayOfYear(1).atStartOfDay();

        BigDecimal daily = BigDecimal.ZERO;
        BigDecimal weekly = BigDecimal.ZERO;
        BigDecimal monthly = BigDecimal.ZERO;
        BigDecimal yearly = BigDecimal.ZERO;

        BigDecimal largest = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;

        Map<String, BigDecimal> sourceSumMap = new HashMap<>();

        for (Transaction t : credits) {
            BigDecimal amt = t.getAmount();
            total = total.add(amt);

            if (t.getCreatedAt().isAfter(startOfToday)) daily = daily.add(amt);
            if (t.getCreatedAt().isAfter(startOfWeek)) weekly = weekly.add(amt);
            if (t.getCreatedAt().isAfter(startOfMonth)) monthly = monthly.add(amt);
            if (t.getCreatedAt().isAfter(startOfYear)) yearly = yearly.add(amt);

            if (amt.compareTo(largest) > 0) largest = amt;

            // Map source based on transaction details
            String sourceName = t.getSenderWallet() != null ? t.getSenderWallet().getUser().getFullName() : "DEPOSIT";
            sourceSumMap.put(sourceName, sourceSumMap.getOrDefault(sourceName, BigDecimal.ZERO).add(amt));
        }

        BigDecimal average = credits.isEmpty() ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(credits.size()), 4, RoundingMode.HALF_UP);

        BigDecimal finalTotal = total;
        List<IncomeSourceItem> sourcesList = sourceSumMap.entrySet().stream()
                .map(entry -> {
                    BigDecimal pct = BigDecimal.ZERO;
                    if (finalTotal.compareTo(BigDecimal.ZERO) > 0) {
                        pct = entry.getValue().multiply(BigDecimal.valueOf(100)).divide(finalTotal, 2, RoundingMode.HALF_UP);
                    }
                    return new IncomeSourceItem(entry.getKey(), entry.getValue(), pct);
                })
                .sorted(Comparator.comparing(IncomeSourceItem::amount).reversed())
                .collect(Collectors.toList());

        return new IncomeAnalyticsResponse(
                daily, weekly, monthly, yearly,
                average, largest, sourcesList
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategorySpendingItem> getCategoryAnalytics(UUID userId) {
        return getSpendingAnalytics(userId).categorySpending();
    }

    @Override
    @Transactional(readOnly = true)
    public TrendsResponse getTrendAnalytics(UUID userId, String period) {
        log.info("Compiling trend analytics for user {} over period {}", userId, period);

        List<Transaction> txs = transactionRepository.findSuccessTransactionsByUserId(userId);
        List<TrendItem> trendItems = new ArrayList<>();

        if ("MONTHLY".equalsIgnoreCase(period)) {
            // Last 6 months
            for (int i = 5; i >= 0; i--) {
                LocalDate targetMonth = LocalDate.now().minusMonths(i);
                String label = targetMonth.getYear() + "-" + String.format("%02d", targetMonth.getMonthValue());
                
                LocalDateTime start = targetMonth.withDayOfMonth(1).atStartOfDay();
                LocalDateTime end = targetMonth.withDayOfMonth(targetMonth.lengthOfMonth()).atTime(23, 59, 59);

                BigDecimal credits = sumTxs(txs, userId, start, end, false);
                BigDecimal debits = sumTxs(txs, userId, start, end, true);

                trendItems.add(new TrendItem(label, credits, debits));
            }
        } else if ("WEEKLY".equalsIgnoreCase(period)) {
            // Last 4 weeks
            for (int i = 3; i >= 0; i--) {
                LocalDate target = LocalDate.now().minusWeeks(i);
                String label = "Wk -" + i;

                LocalDateTime start = target.minusDays(7).atStartOfDay();
                LocalDateTime end = target.atTime(23, 59, 59);

                BigDecimal credits = sumTxs(txs, userId, start, end, false);
                BigDecimal debits = sumTxs(txs, userId, start, end, true);

                trendItems.add(new TrendItem(label, credits, debits));
            }
        } else {
            // DAILY: Last 7 days
            for (int i = 6; i >= 0; i--) {
                LocalDate target = LocalDate.now().minusDays(i);
                String label = target.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.US);

                LocalDateTime start = target.atStartOfDay();
                LocalDateTime end = target.atTime(23, 59, 59);

                BigDecimal credits = sumTxs(txs, userId, start, end, false);
                BigDecimal debits = sumTxs(txs, userId, start, end, true);

                trendItems.add(new TrendItem(label, credits, debits));
            }
        }

        return new TrendsResponse(trendItems);
    }

    private BigDecimal sumTxs(List<Transaction> txs, UUID userId, LocalDateTime start, LocalDateTime end, boolean isDebit) {
        BigDecimal sum = BigDecimal.ZERO;
        for (Transaction t : txs) {
            if (t.getCreatedAt().isAfter(start) && t.getCreatedAt().isBefore(end)) {
                if (isDebit) {
                    if (t.getSenderWallet() != null && t.getSenderWallet().getUser().getId().equals(userId)) {
                        sum = sum.add(t.getAmount());
                    }
                } else {
                    if (t.getReceiverWallet() != null && t.getReceiverWallet().getUser().getId().equals(userId)) {
                        sum = sum.add(t.getAmount());
                    }
                }
            }
        }
        return sum;
    }

    @Override
    @Transactional
    public CategoryUpdateResponse updateTransactionCategory(UUID transactionId, UUID userId, String category) {
        log.info("Updating category of transaction {} to {} for user {}", transactionId, category, userId);

        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));

        boolean isSender = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId);
        boolean isReceiver = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(userId);

        if (!isSender && !isReceiver) {
            throw new ForbiddenException("You are not authorized to update this transaction.");
        }

        tx.setCategory(category.toUpperCase());
        transactionRepository.save(tx);

        return new CategoryUpdateResponse(transactionId, category.toUpperCase());
    }
}
