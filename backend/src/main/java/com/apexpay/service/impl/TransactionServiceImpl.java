package com.apexpay.service.impl;

import com.apexpay.dto.TransactionDetailsResponse;
import com.apexpay.dto.TransactionHistoryResponse;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.service.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional
    public Transaction createTransaction(Wallet senderWallet, Wallet receiverWallet, BigDecimal amount,
                                         TransactionType type, TransactionStatus status, String remarks) {
        log.info("Creating transaction record: Type={}, Status={}, Amount={}", type, status, amount);

        Transaction transaction = new Transaction();
        // Generate dynamic unique reference
        String reference = "APX" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        transaction.setTransactionReference(reference);
        transaction.setSenderWallet(senderWallet);
        transaction.setReceiverWallet(receiverWallet);
        transaction.setAmount(amount);
        transaction.setTransactionType(type);
        transaction.setPaymentMethod(PaymentMethod.WALLET); // Wallet-to-wallet transfer
        transaction.setPaymentStatus(status);
        transaction.setRemarks(remarks);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUpdatedAt(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailsResponse getTransactionDetails(UUID transactionId, UUID currentUserId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));

        // Security check: must be sender or receiver
        UUID senderUser = tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getId() : null;
        UUID receiverUser = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getId() : null;

        if (!currentUserId.equals(senderUser) && !currentUserId.equals(receiverUser)) {
            throw new ForbiddenException("You are not authorized to view this transaction.");
        }

        return mapToDetailsResponse(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionHistoryResponse getTransactionHistory(UUID userId, Pageable pageable) {
        // Find wallet first
        log.info("Fetching transaction history for user UUID: {}", userId);
        
        // Find all page transactions by wallet
        Page<Transaction> page = transactionRepository.findByWalletId(userId, pageable);
        List<TransactionDetailsResponse> dtos = page.getContent().stream()
                .map(this::mapToDetailsResponse)
                .collect(Collectors.toList());

        return new TransactionHistoryResponse(
                dtos,
                page.getNumber(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Override
    @Transactional
    public Transaction updateTransactionStatus(UUID transactionId, TransactionStatus status) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));
        tx.setPaymentStatus(status);
        tx.setUpdatedAt(LocalDateTime.now());
        return transactionRepository.save(tx);
    }

    private TransactionDetailsResponse mapToDetailsResponse(Transaction tx) {
        String senderWalletNum = tx.getSenderWallet() != null ? tx.getSenderWallet().getWalletNumber() : "SYSTEM";
        String senderName = tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getFullName() : "SYSTEM";
        String receiverWalletNum = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getWalletNumber() : "SYSTEM";
        String receiverName = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : "SYSTEM";
        String currency = tx.getSenderWallet() != null ? tx.getSenderWallet().getCurrency() : "USD";

        return new TransactionDetailsResponse(
                tx.getId(),
                tx.getTransactionReference(),
                senderWalletNum,
                senderName,
                receiverWalletNum,
                receiverName,
                tx.getAmount(),
                currency,
                tx.getPaymentStatus().name(),
                tx.getTransactionType().name(),
                tx.getRemarks(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}
