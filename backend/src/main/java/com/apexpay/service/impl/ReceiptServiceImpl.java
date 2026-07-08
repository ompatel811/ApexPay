package com.apexpay.service.impl;

import com.apexpay.dto.PaymentReceiptResponse;
import com.apexpay.entity.Transaction;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.service.ReceiptService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
public class ReceiptServiceImpl implements ReceiptService {

    private final TransactionRepository transactionRepository;

    public ReceiptServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentReceiptResponse getReceipt(UUID transactionId, UUID currentUserId) {
        log.info("Generating payment receipt for Transaction ID: {}", transactionId);
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found."));

        // Security check: must be sender or receiver
        UUID senderUser = tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getId() : null;
        UUID receiverUser = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getId() : null;

        if (!currentUserId.equals(senderUser) && !currentUserId.equals(receiverUser)) {
            throw new ForbiddenException("You are not authorized to access this receipt.");
        }

        String senderWalletNum = tx.getSenderWallet() != null ? tx.getSenderWallet().getWalletNumber() : "SYSTEM";
        String senderName = tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getFullName() : "SYSTEM";
        String receiverWalletNum = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getWalletNumber() : "SYSTEM";
        String receiverName = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : "SYSTEM";
        String currency = tx.getSenderWallet() != null ? tx.getSenderWallet().getCurrency() : "USD";

        return new PaymentReceiptResponse(
                tx.getTransactionReference(),
                tx.getId(),
                senderName,
                senderWalletNum,
                receiverName,
                receiverWalletNum,
                tx.getAmount(),
                currency,
                tx.getPaymentStatus().name(),
                tx.getCreatedAt(),
                tx.getRemarks()
        );
    }
}
