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
        log.info("Creating double-entry ledger listings for Transaction Ref: {}", transaction.getTransactionReference());

        // 1. Debit Entry for Sender
        WalletLedger debitEntry = new WalletLedger();
        debitEntry.setWallet(sender);
        debitEntry.setReferenceNumber(transaction.getTransactionReference());
        debitEntry.setTransactionType("TRANSFER");
        debitEntry.setAmount(amount);
        
        // Balance after debit is sender's current balance, balance before was balance + amount
        BigDecimal senderBalanceAfter = sender.getBalance();
        BigDecimal senderBalanceBefore = senderBalanceAfter.add(amount);
        debitEntry.setBalanceBefore(senderBalanceBefore);
        debitEntry.setBalanceAfter(senderBalanceAfter);
        
        debitEntry.setTimestamp(LocalDateTime.now());
        debitEntry.setRemarks("Transfer to " + receiver.getUser().getFullName() + " (" + receiver.getWalletNumber() + ")");
        debitEntry.setStatus("SUCCESS");
        debitEntry.setTransaction(transaction);
        debitEntry.setDirection("DEBIT");

        walletLedgerRepository.save(debitEntry);
        log.debug("Debit ledger entry created successfully for wallet: {}", sender.getWalletNumber());

        // 2. Credit Entry for Receiver
        WalletLedger creditEntry = new WalletLedger();
        creditEntry.setWallet(receiver);
        creditEntry.setReferenceNumber(transaction.getTransactionReference());
        creditEntry.setTransactionType("TRANSFER");
        creditEntry.setAmount(amount);

        // Balance after credit is receiver's current balance, balance before was balance - amount
        BigDecimal receiverBalanceAfter = receiver.getBalance();
        BigDecimal receiverBalanceBefore = receiverBalanceAfter.subtract(amount);
        creditEntry.setBalanceBefore(receiverBalanceBefore);
        creditEntry.setBalanceAfter(receiverBalanceAfter);

        creditEntry.setTimestamp(LocalDateTime.now());
        creditEntry.setRemarks("Transfer from " + sender.getUser().getFullName() + " (" + sender.getWalletNumber() + ")");
        creditEntry.setStatus("SUCCESS");
        creditEntry.setTransaction(transaction);
        creditEntry.setDirection("CREDIT");

        walletLedgerRepository.save(creditEntry);
        log.debug("Credit ledger entry created successfully for wallet: {}", receiver.getWalletNumber());
    }
}
