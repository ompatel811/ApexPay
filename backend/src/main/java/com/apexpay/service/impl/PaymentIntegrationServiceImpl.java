package com.apexpay.service.impl;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.entity.Transaction;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.service.PaymentIntegrationService;
import com.apexpay.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
public class PaymentIntegrationServiceImpl implements PaymentIntegrationService {

    private final PaymentService paymentService;
    private final TransactionRepository transactionRepository;

    public PaymentIntegrationServiceImpl(PaymentService paymentService,
                                         TransactionRepository transactionRepository) {
        this.paymentService = paymentService;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public Transaction delegateTransfer(UUID senderUserId, String recipientWalletNumber, BigDecimal amount,
                                         String remarks, String idempotencyKey) {
        log.info("Delegating QR Payment execution to Module 6 PaymentService. Sender: {}, Receiver Wallet: {}, Amount: {}",
                senderUserId, recipientWalletNumber, amount);

        // Build standard SendMoneyRequest to trigger full validation, pessimistic locking, double-entry ledgers, and audit trails.
        SendMoneyRequest request = new SendMoneyRequest(recipientWalletNumber, amount, remarks, idempotencyKey);
        SendMoneyResponse response = paymentService.processTransfer(senderUserId, request);

        // Load the saved Transaction record to return
        return transactionRepository.findById(response.transactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction record not found after delegation."));
    }
}
