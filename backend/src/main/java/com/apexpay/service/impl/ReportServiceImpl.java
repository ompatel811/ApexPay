package com.apexpay.service.impl;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.dto.AccountStatementResponse;
import com.apexpay.dto.TransactionStatementItem;
import com.apexpay.entity.StatementHistory;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.StatementHistoryRepository;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.ReportService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ReportServiceImpl implements ReportService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final StatementHistoryRepository statementHistoryRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Autowired
    public ReportServiceImpl(TransactionRepository transactionRepository,
                             WalletRepository walletRepository,
                             StatementHistoryRepository statementHistoryRepository,
                             UserRepository userRepository,
                             AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.statementHistoryRepository = statementHistoryRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public AccountStatementResponse generateStatement(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating account statement for user {} from {} to {}", userId, startDate, endDate);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found."));

        List<Transaction> allTxs = transactionRepository.findSuccessTransactionsByUserId(userId);

        // Sort ascending
        allTxs.sort(Comparator.comparing(Transaction::getCreatedAt));

        // Trace backward from current balance to compute closing balance at endDate and opening balance at startDate
        BigDecimal currentBalance = wallet.getBalance();
        BigDecimal closingBalance = currentBalance;

        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        LocalDateTime startDateTime = startDate.atStartOfDay();

        // 1. Subtract credits and add back debits occurred after endDate
        for (Transaction t : allTxs) {
            if (t.getCreatedAt().isAfter(endDateTime)) {
                boolean isDebit = t.getSenderWallet() != null && t.getSenderWallet().getUser().getId().equals(userId);
                if (isDebit) {
                    closingBalance = closingBalance.add(t.getAmount());
                } else {
                    closingBalance = closingBalance.subtract(t.getAmount());
                }
            }
        }

        // 2. Collect statement items and calculate opening balance
        BigDecimal openingBalance = closingBalance;
        BigDecimal creditsSum = BigDecimal.ZERO;
        BigDecimal debitsSum = BigDecimal.ZERO;
        List<TransactionStatementItem> statementItems = new ArrayList<>();

        for (Transaction t : allTxs) {
            LocalDateTime created = t.getCreatedAt();
            if (!created.isBefore(startDateTime) && !created.isAfter(endDateTime)) {
                boolean isDebit = t.getSenderWallet() != null && t.getSenderWallet().getUser().getId().equals(userId);
                String direction = isDebit ? "DEBIT" : "CREDIT";
                
                if (isDebit) {
                    debitsSum = debitsSum.add(t.getAmount());
                } else {
                    creditsSum = creditsSum.add(t.getAmount());
                }

                String description = isDebit 
                        ? "Paid to " + (t.getReceiverWallet() != null ? t.getReceiverWallet().getUser().getFullName() : "External Account")
                        : "Received from " + (t.getSenderWallet() != null ? t.getSenderWallet().getUser().getFullName() : "External Deposit");

                statementItems.add(new TransactionStatementItem(
                        t.getTransactionReference(),
                        t.getCreatedAt(),
                        t.getTransactionType().name(),
                        description,
                        direction,
                        t.getAmount(),
                        t.getCategory(),
                        t.getPaymentStatus().name()
                ));
            }
        }

        // Subtract credit sum and add back debit sum of the statement period to reconstruct opening balance
        openingBalance = closingBalance.subtract(creditsSum).add(debitsSum);

        // Record history log
        StatementHistory hist = new StatementHistory();
        hist.setUser(user);
        hist.setStatementPeriod(startDate + " to " + endDate);
        hist.setOpeningBalance(openingBalance);
        hist.setClosingBalance(closingBalance);
        hist.setCredits(creditsSum);
        hist.setDebits(debitsSum);
        hist.setCreatedAt(LocalDateTime.now());
        statementHistoryRepository.save(hist);

        auditService.log("ACCOUNT_STATEMENT_GENERATED", userId, "StatementHistory", hist.getId());

        return new AccountStatementResponse(
                openingBalance,
                closingBalance,
                creditsSum,
                debitsSum,
                statementItems,
                startDate + " to " + endDate
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportTransactions(UUID userId, String format, LocalDate startDate, LocalDate endDate) {
        log.info("Exporting transaction report for user {} in format {} from {} to {}", userId, format, startDate, endDate);

        AccountStatementResponse stmt = generateStatement(userId, startDate, endDate);

        if ("PDF".equalsIgnoreCase(format)) {
            return generateTextPdfBytes(stmt);
        } else if ("EXCEL".equalsIgnoreCase(format) || "XLS".equalsIgnoreCase(format)) {
            return generateTsvBytes(stmt);
        } else {
            return generateCsvBytes(stmt);
        }
    }

    private byte[] generateCsvBytes(AccountStatementResponse stmt) {
        StringBuilder sb = new StringBuilder();
        sb.append("Reference Number,Date,Type,Description,Category,Direction,Amount,Status\n");
        for (TransactionStatementItem item : stmt.transactions()) {
            sb.append(String.format("%s,%s,%s,%s,%s,%s,%s,%s\n",
                    item.transactionReference(),
                    item.timestamp(),
                    item.type(),
                    item.description().replace(",", " "),
                    item.category(),
                    item.direction(),
                    item.amount(),
                    item.status()
            ));
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateTsvBytes(AccountStatementResponse stmt) {
        // Tab separated value format works natively inside Excel
        StringBuilder sb = new StringBuilder();
        sb.append("Reference Number\tDate\tType\tDescription\tCategory\tDirection\tAmount\tStatus\n");
        for (TransactionStatementItem item : stmt.transactions()) {
            sb.append(String.format("%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n",
                    item.transactionReference(),
                    item.timestamp(),
                    item.type(),
                    item.description(),
                    item.category(),
                    item.direction(),
                    item.amount(),
                    item.status()
            ));
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateTextPdfBytes(AccountStatementResponse stmt) {
        // Simple beautifully formatted text document representation that acts as PDF/Statement file
        StringBuilder sb = new StringBuilder();
        sb.append("=========================================================================\n");
        sb.append("                      APEXPAY DIGITAL PLATFORM STATEMENT                 \n");
        sb.append("=========================================================================\n");
        sb.append(String.format("Statement Period: %s\n", stmt.summaryPeriod()));
        sb.append(String.format("Generated At:     %s\n\n", LocalDate.now()));
        sb.append("Summary:\n");
        sb.append(String.format("  Opening Balance:  $%s\n", stmt.openingBalance()));
        sb.append(String.format("  Closing Balance:  $%s\n", stmt.closingBalance()));
        sb.append(String.format("  Total Credits:    $%s\n", stmt.creditsSum()));
        sb.append(String.format("  Total Debits:     $%s\n\n", stmt.debitsSum()));
        sb.append("-------------------------------------------------------------------------\n");
        sb.append("TRANSACTION HISTORY\n");
        sb.append("-------------------------------------------------------------------------\n");
        sb.append(String.format("%-16s | %-12s | %-8s | %-10s | %-8s | %s\n", "Ref", "Date", "Direction", "Category", "Amount", "Description"));
        sb.append("-------------------------------------------------------------------------\n");
        for (TransactionStatementItem item : stmt.transactions()) {
            String refShort = item.transactionReference().length() > 14 
                    ? item.transactionReference().substring(0, 14) 
                    : item.transactionReference();
            String dateShort = item.timestamp().toLocalDate().toString();
            sb.append(String.format("%-16s | %-12s | %-8s | %-10s | $%-7.2f | %s\n",
                    refShort,
                    dateShort,
                    item.direction(),
                    item.category(),
                    item.amount().doubleValue(),
                    item.description()
            ));
        }
        sb.append("=========================================================================\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
