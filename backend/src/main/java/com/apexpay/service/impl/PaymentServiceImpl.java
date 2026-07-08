package com.apexpay.service.impl;

import com.apexpay.dto.PaymentValidationResponse;
import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.entity.IdempotencyKey;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.UpiId;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.WalletLedger;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.IdempotencyKeyRepository;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.repository.UpiIdRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletLedgerRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.NotificationService;
import com.apexpay.service.PaymentService;
import com.apexpay.service.ValidationService;
import com.apexpay.service.WalletTransferService;
import com.apexpay.service.TransactionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final ValidationService validationService;
    private final WalletTransferService walletTransferService;
    private final TransactionService transactionService;
    private final AuditService auditService;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final ObjectMapper objectMapper;
    private final UpiIdRepository upiIdRepository;
    private final NotificationService notificationService;

    public PaymentServiceImpl(ValidationService validationService,
                              WalletTransferService walletTransferService,
                              TransactionService transactionService,
                              AuditService auditService,
                              IdempotencyKeyRepository idempotencyKeyRepository,
                              WalletRepository walletRepository,
                              UserRepository userRepository,
                              WalletLedgerRepository walletLedgerRepository,
                              ObjectMapper objectMapper,
                              UpiIdRepository upiIdRepository,
                              NotificationService notificationService) {
        this.validationService = validationService;
        this.walletTransferService = walletTransferService;
        this.transactionService = transactionService;
        this.auditService = auditService;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.objectMapper = objectMapper;
        this.upiIdRepository = upiIdRepository;
        this.notificationService = notificationService;
    }

    @Override
    public SendMoneyResponse processTransfer(UUID senderUserId, SendMoneyRequest request) {
        String key = request.idempotencyKey();
        log.info("Processing transfer request. Sender: {}, Recipient: {}, Amount: {}, IdempotencyKey: {}",
                senderUserId, request.recipientIdentifier(), request.amount(), key);

        // 1. Check Idempotency Key Replays
        Optional<IdempotencyKey> existingKeyOpt = idempotencyKeyRepository.findById(key);
        if (existingKeyOpt.isPresent()) {
            IdempotencyKey existingKey = existingKeyOpt.get();
            if ("PROCESSING".equals(existingKey.getResponseBody())) {
                throw new BusinessException("Your transaction is currently being processed. Please wait.");
            }
            try {
                log.info("Duplicate request detected. Returning replayed transaction response from database.");
                return objectMapper.readValue(existingKey.getResponseBody(), SendMoneyResponse.class);
            } catch (JsonProcessingException e) {
                log.error("Failed to parse replayed response body", e);
                throw new BusinessException("Duplicate request. An error occurred retrieving status.");
            }
        }

        // 2. Dry-run Validations (limits, positive amount, active, etc.)
        validationService.validateTransfer(senderUserId, request);

        // 3. Reserve Idempotency Lock
        IdempotencyKey lockKey = new IdempotencyKey(key, "PROCESSING");
        idempotencyKeyRepository.save(lockKey);
        log.debug("Reserved idempotency lock in database.");

        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender wallet not found."));

        // Resolve receiver wallet
        Wallet receiverWallet = resolveReceiverWallet(request.recipientIdentifier());

        try {
            // Audit Log - Payment Started
            auditService.log("PAYMENT_STARTED", senderUserId, "Wallet", senderWallet.getId());

            // 4. Execute Core Transfer in isolated transaction boundary
            Transaction tx = walletTransferService.executeTransfer(
                    senderWallet.getId(), receiverWallet.getId(), request.amount(), request.remarks()
            );

            // 5. Map to response
            SendMoneyResponse response = new SendMoneyResponse(
                    tx.getTransactionReference(),
                    tx.getId(),
                    tx.getPaymentStatus().name(),
                    tx.getAmount(),
                    senderWallet.getCurrency(),
                    senderWallet.getWalletNumber(),
                    receiverWallet.getWalletNumber(),
                    tx.getCreatedAt(),
                    tx.getRemarks()
            );

            // 6. Update Idempotency response body
            String responseJson = objectMapper.writeValueAsString(response);
            lockKey.setResponseBody(responseJson);
            idempotencyKeyRepository.save(lockKey);

            // Audit Log - Payment Success
            auditService.log("PAYMENT_SUCCESS", senderUserId, "Transaction", tx.getId());

            // Real-Time & Email Notifications
            try {
                notificationService.sendNotification(
                        senderWallet.getUser(),
                        "Payment Sent Successfully",
                        String.format("You successfully transferred $%s to %s. Ref: %s", tx.getAmount(), receiverWallet.getUser().getFullName(), tx.getTransactionReference()),
                        NotificationType.PAYMENT_SUCCESS
                );
                notificationService.sendNotification(
                        receiverWallet.getUser(),
                        "Payment Received",
                        String.format("You received $%s from %s. Ref: %s", tx.getAmount(), senderWallet.getUser().getFullName(), tx.getTransactionReference()),
                        NotificationType.PAYMENT_RECEIVED
                );
            } catch (Exception notifEx) {
                log.error("Failed to send transaction success notifications", notifEx);
            }

            return response;

        } catch (Exception e) {
            log.error("Transfer failed. Releasing idempotency lock.", e);
            // Release lock or update to FAILED so user can retry
            idempotencyKeyRepository.delete(lockKey);

            // Audit Log - Payment Failure
            auditService.log("PAYMENT_FAILURE", senderUserId, "Wallet", senderWallet.getId());

            try {
                notificationService.sendNotification(
                        senderWallet.getUser(),
                        "Payment Failed",
                        String.format("Your transfer of $%s failed. Reason: %s", request.amount(), e.getMessage()),
                        NotificationType.PAYMENT_FAILED
                );
            } catch (Exception notifEx) {
                log.error("Failed to send payment failure notification", notifEx);
            }

            if (e instanceof BusinessException) {
                throw (BusinessException) e;
            } else if (e instanceof ResourceNotFoundException) {
                throw (ResourceNotFoundException) e;
            }
            throw new BusinessException("Transaction execution failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentValidationResponse validateTransferRequest(UUID senderUserId, SendMoneyRequest request) {
        log.info("Dry-run validating transfer request for user: {}", senderUserId);
        try {
            // Run standard validations
            validationService.validateTransfer(senderUserId, request);

            Wallet senderWallet = walletRepository.findByUserId(senderUserId).orElseThrow();
            Wallet receiverWallet = resolveReceiverWallet(request.recipientIdentifier());

            // Compute remaining daily/monthly limits
            LocalDateTime startOfToday = LocalDateTime.now().with(LocalTime.MIN);
            List<WalletLedger> todayEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(senderWallet.getId(), startOfToday);
            BigDecimal todaySpentTransfers = todayEntries.stream()
                    .filter(e -> "TRANSFER".equalsIgnoreCase(e.getTransactionType()) 
                            && "DEBIT".equalsIgnoreCase(e.getDirection()) 
                            && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                    .map(WalletLedger::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);
            List<WalletLedger> monthEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(senderWallet.getId(), startOfMonth);
            BigDecimal monthlySpentTransfers = monthEntries.stream()
                    .filter(e -> "TRANSFER".equalsIgnoreCase(e.getTransactionType()) 
                            && "DEBIT".equalsIgnoreCase(e.getDirection()) 
                            && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                    .map(WalletLedger::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal dailyLimitRemaining = senderWallet.getDailyTransferLimit().subtract(todaySpentTransfers).max(BigDecimal.ZERO);
            BigDecimal monthlyLimitRemaining = senderWallet.getMonthlyTransferLimit().subtract(monthlySpentTransfers).max(BigDecimal.ZERO);

            return new PaymentValidationResponse(
                    true,
                    "Validation check passed successfully. Safe to proceed.",
                    senderWallet.getWalletNumber(),
                    senderWallet.getUser().getFullName(),
                    receiverWallet.getWalletNumber(),
                    receiverWallet.getUser().getFullName(),
                    request.amount(),
                    dailyLimitRemaining,
                    monthlyLimitRemaining
            );

        } catch (Exception e) {
            log.warn("Dry-run validation failed: {}", e.getMessage());
            return new PaymentValidationResponse(
                    false,
                    e.getMessage(),
                    null, null, null, null,
                    request.amount(),
                    BigDecimal.ZERO, BigDecimal.ZERO
            );
        }
    }

    @Override
    @Transactional
    public void cancelPayment(UUID transactionId, UUID currentUserId) {
        log.info("Request to cancel payment: Transaction={}, User={}", transactionId, currentUserId);
        Transaction tx = transactionService.updateTransactionStatus(transactionId, TransactionStatus.CANCELLED);
        auditService.log("PAYMENT_CANCELLED", currentUserId, "Transaction", tx.getId());
    }

    private Wallet resolveReceiverWallet(String recipient) {
        String query = recipient.trim();
        if (query.contains("@")) {
            if (query.endsWith("@apexpay")) {
                UpiId upi = upiIdRepository.findByUpiId(query)
                        .orElseThrow(() -> new ResourceNotFoundException("UPI ID not found: " + query));
                return walletRepository.findByUserId(upi.getUser().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found for UPI ID."));
            } else {
                User u = userRepository.findByEmail(query)
                        .orElseThrow(() -> new ResourceNotFoundException("Recipient email not found: " + query));
                return walletRepository.findByUserId(u.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
            }
        } else if (query.startsWith("APX") || (query.length() >= 10 && query.matches("[A-Z0-9]+"))) {
            return walletRepository.findByWalletNumber(query)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet number not found: " + query));
        } else if (query.matches("^\\+?[1-9]\\d{1,14}$")) {
            User u = userRepository.findByMobileNumber(query)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient phone not found: " + query));
            return walletRepository.findByUserId(u.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
        } else {
            User u = userRepository.findByUsername(query)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient username not found: " + query));
            return walletRepository.findByUserId(u.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
        }
    }
}
