package com.apexpay.service.impl;

import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.WalletLedger;
import com.apexpay.repository.WalletLedgerRepository;
import com.apexpay.service.LedgerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
public class LedgerServiceImpl implements LedgerService {

    private final WalletLedgerRepository walletLedgerRepository;

    public LedgerServiceImpl(WalletLedgerRepository walletLedgerRepository) {
        this.walletLedgerRepository = walletLedgerRepository;
    }

    @Override
    @Transactional
    public void createLedgerEntries(Transaction transaction, Wallet sender, Wallet receiver, BigDecimal amount) {
        log.info("Creating ledger listings for Transaction Ref: {}", transaction.getTransactionReference());

        // 1. Debit Entry for Sender
        if (sender != null) {
            WalletLedger debitEntry = new WalletLedger();
            debitEntry.setWallet(sender);
            debitEntry.setReferenceNumber(transaction.getTransactionReference());
            debitEntry.setTransactionType(transaction.getTransactionType() != null ? transaction.getTransactionType().name() : "TRANSFER");
            debitEntry.setAmount(amount);
            
            BigDecimal senderBalanceAfter = sender.getBalance();
            BigDecimal senderBalanceBefore = senderBalanceAfter.add(amount);
            debitEntry.setBalanceBefore(senderBalanceBefore);
            debitEntry.setBalanceAfter(senderBalanceAfter);
            
            debitEntry.setTimestamp(LocalDateTime.now());
            String destName = (receiver != null) ? receiver.getUser().getFullName() + " (" + receiver.getWalletNumber() + ")" : "External Bank / Settlement";
            debitEntry.setRemarks(transaction.getRemarks() != null ? transaction.getRemarks() : "Debit payout to " + destName);
            debitEntry.setStatus("SUCCESS");
            debitEntry.setTransaction(transaction);
            debitEntry.setDirection("DEBIT");

            walletLedgerRepository.save(debitEntry);
            log.debug("Debit ledger entry created successfully for wallet: {}", sender.getWalletNumber());
        }

        // 2. Credit Entry for Receiver
        if (receiver != null) {
            WalletLedger creditEntry = new WalletLedger();
            creditEntry.setWallet(receiver);
            creditEntry.setReferenceNumber(transaction.getTransactionReference());
            creditEntry.setTransactionType(transaction.getTransactionType() != null ? transaction.getTransactionType().name() : "TRANSFER");
            creditEntry.setAmount(amount);

            BigDecimal receiverBalanceAfter = receiver.getBalance();
            BigDecimal receiverBalanceBefore = receiverBalanceAfter.subtract(amount);
            creditEntry.setBalanceBefore(receiverBalanceBefore);
            creditEntry.setBalanceAfter(receiverBalanceAfter);

            creditEntry.setTimestamp(LocalDateTime.now());
            String srcName = (sender != null) ? sender.getUser().getFullName() + " (" + sender.getWalletNumber() + ")" : "External Source / Deposit";
            creditEntry.setRemarks(transaction.getRemarks() != null ? transaction.getRemarks() : "Credit receipt from " + srcName);
            creditEntry.setStatus("SUCCESS");
            creditEntry.setTransaction(transaction);
            creditEntry.setDirection("CREDIT");

            walletLedgerRepository.save(creditEntry);
            log.debug("Credit ledger entry created successfully for wallet: {}", receiver.getWalletNumber());
        }
    }
}
