package com.apexpay.service.impl;

import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.LedgerService;
import com.apexpay.service.TransactionService;
import com.apexpay.service.WalletTransferService;
import com.apexpay.service.BudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
public class WalletTransferServiceImpl implements WalletTransferService {

    private final WalletRepository walletRepository;
    private final TransactionService transactionService;
    private final LedgerService ledgerService;
    private final TransactionRepository transactionRepository;
    private final BudgetService budgetService;

    public WalletTransferServiceImpl(WalletRepository walletRepository,
            TransactionService transactionService,
            LedgerService ledgerService,
            TransactionRepository transactionRepository,
            BudgetService budgetService) {
        this.walletRepository = walletRepository;
        this.transactionService = transactionService;
        this.ledgerService = ledgerService;
        this.transactionRepository = transactionRepository;
        this.budgetService = budgetService;
    }

    @Override
    @Transactional
    public Transaction executeTransfer(UUID senderWalletId, UUID receiverWalletId, BigDecimal amount, String remarks) {
        log.info("Starting wallet transfer transaction: sender={}, receiver={}, amount={}", senderWalletId,
                receiverWalletId, amount);

        // 1. Lock Sender and Receiver Wallets in Sorted Order to Prevent Deadlocks
        Wallet lockedSender;
        Wallet lockedReceiver;

        if (senderWalletId.compareTo(receiverWalletId) < 0) {
            lockedSender = walletRepository.findByIdForUpdate(senderWalletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sender wallet not found."));
            lockedReceiver = walletRepository.findByIdForUpdate(receiverWalletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Receiver wallet not found."));
        } else {
            lockedReceiver = walletRepository.findByIdForUpdate(receiverWalletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Receiver wallet not found."));
            lockedSender = walletRepository.findByIdForUpdate(senderWalletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sender wallet not found."));
        }

        log.debug(
                "Acquired pessimistic write locks on both wallets. Sender balance before: {}, Receiver balance before: {}",
                lockedSender.getBalance(), lockedReceiver.getBalance());

        // Double-check balance after lock acquisition (re-validation check inside
        // locking window)
        if (lockedSender.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient balance.");
        }

        // 2. Perform Debit and Credit Updates
        lockedSender.setBalance(lockedSender.getBalance().subtract(amount));
        lockedReceiver.setBalance(lockedReceiver.getBalance().add(amount));

        walletRepository.save(lockedSender);
        walletRepository.save(lockedReceiver);

        log.debug("Updated wallet balances. Sender balance after: {}, Receiver balance after: {}",
                lockedSender.getBalance(), lockedReceiver.getBalance());

        // 3. Log transaction
        Transaction transaction = transactionService.createTransaction(
                lockedSender, lockedReceiver, amount,
                TransactionType.TRANSFER, TransactionStatus.SUCCESS, remarks);

        // Auto-categorize based on remarks
        String category = determineCategory(remarks);
        transaction.setCategory(category);
        transaction = transactionRepository.save(transaction);

        // 4. Create Ledger Listings
        ledgerService.createLedgerEntries(transaction, lockedSender, lockedReceiver, amount);

        // 5. Update Budgets & trigger warnings
        try {
            String currentMonth = DateTimeFormatter.ofPattern("yyyy-MM").format(LocalDate.now());
            budgetService.checkAndUpdateBudgetsOnTransaction(lockedSender.getUser().getId(), category, amount,
                    currentMonth);
        } catch (Exception e) {
            log.error("Failed to update budget tracker for user {}", lockedSender.getUser().getId(), e);
        }

        log.info("Wallet-to-wallet transfer successfully committed. Ref: {}, Category: {}",
                transaction.getTransactionReference(), category);
        return transaction;
    }

    private String determineCategory(String remarks) {
        if (remarks == null)
            return "OTHER";
        String r = remarks.toLowerCase();
        if (r.contains("food") || r.contains("dinner") || r.contains("lunch") || r.contains("restaurant")
                || r.contains("swiggy") || r.contains("zomato")) {
            return "FOOD";
        }
        if (r.contains("shop") || r.contains("buy") || r.contains("amazon") || r.contains("flipkart")
                || r.contains("clothing") || r.contains("groceries")) {
            return "SHOPPING";
        }
        if (r.contains("cab") || r.contains("taxi") || r.contains("uber") || r.contains("travel")
                || r.contains("flight") || r.contains("train") || r.contains("bus")) {
            return "TRAVEL";
        }
        if (r.contains("recharge") || r.contains("mobile") || r.contains("airtel") || r.contains("jio")
                || r.contains("phone")) {
            return "RECHARGE";
        }
        if (r.contains("electricity") || r.contains("water") || r.contains("gas") || r.contains("utilities")) {
            return "UTILITIES";
        }
        if (r.contains("rent") || r.contains("wifi") || r.contains("internet") || r.contains("broadband")
                || r.contains("bill")) {
            return "BILLS";
        }
        if (r.contains("medical") || r.contains("doctor") || r.contains("pharmacy") || r.contains("medicine")
                || r.contains("hospital")) {
            return "MEDICAL";
        }
        if (r.contains("school") || r.contains("college") || r.contains("tuition") || r.contains("education")
                || r.contains("fees")) {
            return "EDUCATION";
        }
        if (r.contains("stock") || r.contains("mutual fund") || r.contains("investment") || r.contains("crypto")
                || r.contains("shares")) {
            return "INVESTMENT";
        }
        if (r.contains("movie") || r.contains("netflix") || r.contains("spotify") || r.contains("game")
                || r.contains("entertainment")) {
            return "ENTERTAINMENT";
        }
        if (r.contains("salary") || r.contains("stipend") || r.contains("income")) {
            return "SALARY";
        }
        if (r.contains("transfer") || r.contains("gift") || r.contains("friend")) {
            return "TRANSFER";
        }
        return "OTHER";
    }
}
