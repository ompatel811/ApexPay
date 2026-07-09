package com.apexpay.service.impl;

import com.apexpay.dto.CreateRefundRequest;
import com.apexpay.dto.RefundResponse;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.entity.enums.MerchantRoleName;
import com.apexpay.entity.enums.RefundStatus;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.*;
import com.apexpay.service.LedgerService;
import com.apexpay.service.MerchantService;
import com.apexpay.service.NotificationService;
import com.apexpay.service.RefundService;
import com.apexpay.service.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final MerchantService merchantService;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final TransactionService transactionService;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;
    private final MerchantEmployeeRepository merchantEmployeeRepository;

    public RefundServiceImpl(RefundRepository refundRepository,
                             MerchantService merchantService,
                             TransactionRepository transactionRepository,
                             WalletRepository walletRepository,
                             TransactionService transactionService,
                             LedgerService ledgerService,
                             NotificationService notificationService,
                             MerchantEmployeeRepository merchantEmployeeRepository) {
        this.refundRepository = refundRepository;
        this.merchantService = merchantService;
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.transactionService = transactionService;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
        this.merchantEmployeeRepository = merchantEmployeeRepository;
    }

    @Override
    @Transactional
    public RefundResponse createRefund(UUID currentUserId, CreateRefundRequest request) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        log.info("Merchant {} requesting refund for transaction: {}", merchant.getBusinessName(), request.transactionId());

        Transaction tx = transactionRepository.findById(request.transactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Original transaction not found."));

        // Check if receiver wallet matches merchant's shadow wallet
        String mchWalletNum = merchant.getWallet().getWalletNumber();
        if (!tx.getReceiverWallet().getWalletNumber().equalsIgnoreCase(mchWalletNum)) {
            throw new BusinessException("You do not own this transaction.");
        }

        if (tx.getPaymentStatus() != TransactionStatus.SUCCESS) {
            throw new BusinessException("Cannot refund a non-successful transaction.");
        }

        // Check if a refund was already processed
        if (refundRepository.findByTransactionId(tx.getId()).isPresent()) {
            throw new BusinessException("Refund is already requested or completed for this transaction.");
        }

        if (request.amount().compareTo(tx.getAmount()) > 0) {
            throw new BusinessException("Refund amount cannot exceed original transaction amount.");
        }

        Refund refund = new Refund();
        refund.setMerchant(merchant);
        refund.setTransaction(tx);
        refund.setAmount(request.amount());
        refund.setReason(request.reason());
        refund.setStatus(RefundStatus.PENDING);

        refund = refundRepository.save(refund);

        return mapToResponse(refund);
    }

    @Override
    @Transactional
    public RefundResponse approveRefund(UUID currentUserId, UUID refundId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN, MerchantRoleName.MANAGER);

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund request not found."));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BusinessException("Refund has already been processed. Current status: " + refund.getStatus());
        }

        Transaction originalTx = refund.getTransaction();

        // 1. Resolve wallets
        Wallet merchantShadowWallet = walletRepository.findByWalletNumber(merchant.getWallet().getWalletNumber()).orElseThrow();
        Wallet customerWallet = walletRepository.findById(originalTx.getSenderWallet().getId()).orElseThrow();

        // 2. Lock both wallets in sorted order
        Wallet lockedSender;
        Wallet lockedReceiver;

        if (merchantShadowWallet.getId().compareTo(customerWallet.getId()) < 0) {
            lockedSender = walletRepository.findByIdForUpdate(merchantShadowWallet.getId()).orElseThrow();
            lockedReceiver = walletRepository.findByIdForUpdate(customerWallet.getId()).orElseThrow();
        } else {
            lockedReceiver = walletRepository.findByIdForUpdate(customerWallet.getId()).orElseThrow();
            lockedSender = walletRepository.findByIdForUpdate(merchantShadowWallet.getId()).orElseThrow();
        }

        BigDecimal refundAmt = refund.getAmount();

        if (lockedSender.getBalance().compareTo(refundAmt) < 0) {
            throw new BusinessException("Insufficient merchant wallet balance to process refund.");
        }

        // 3. Subtract from merchant, Add to customer
        lockedSender.setBalance(lockedSender.getBalance().subtract(refundAmt));
        lockedReceiver.setBalance(lockedReceiver.getBalance().add(refundAmt));

        walletRepository.save(lockedSender);
        walletRepository.save(lockedReceiver);

        // 4. Create successful Reversal Transaction
        Transaction refundTx = transactionService.createTransaction(
                lockedSender, lockedReceiver, refundAmt,
                TransactionType.REFUND, TransactionStatus.SUCCESS,
                "Refund for " + originalTx.getTransactionReference()
        );

        // 5. Write Ledger entries
        ledgerService.createLedgerEntries(refundTx, lockedSender, lockedReceiver, refundAmt);

        // 6. Update Refund entity
        refund.setStatus(RefundStatus.APPROVED);
        refund = refundRepository.save(refund);

        // 7. Push real-time WebSocket notifications
        try {
            // Customer notification
            notificationService.sendNotification(
                    lockedReceiver.getUser(),
                    "Refund Completed",
                    String.format("You received a refund of $%s for Tx: %s.", refundAmt, originalTx.getTransactionReference()),
                    NotificationType.PAYMENT_RECEIVED
            );

            // Merchant owner notification
            notificationService.sendNotification(
                    merchant.getOwner(),
                    "Refund Approved",
                    String.format("Refund of $%s approved for Customer %s. Ref: %s", refundAmt, lockedReceiver.getUser().getFullName(), refundTx.getTransactionReference()),
                    NotificationType.SYSTEM_NOTIFICATION
            );
        } catch (Exception e) {
            log.error("Failed to dispatch refund success notifications", e);
        }

        return mapToResponse(refund);
    }

    @Override
    @Transactional
    public RefundResponse rejectRefund(UUID currentUserId, UUID refundId, String reason) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN, MerchantRoleName.MANAGER);

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund request not found."));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BusinessException("Refund has already been processed. Current status: " + refund.getStatus());
        }

        refund.setStatus(RefundStatus.REJECTED);
        refund.setRejectedReason(reason);
        refund = refundRepository.save(refund);

        try {
            notificationService.sendNotification(
                    merchant.getOwner(),
                    "Refund Rejected",
                    String.format("Refund request for Tx: %s rejected. Reason: %s", refund.getTransaction().getTransactionReference(), reason),
                    NotificationType.SYSTEM_NOTIFICATION
            );
        } catch (Exception e) {
            log.error("Failed to notify refund rejection", e);
        }

        return mapToResponse(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> getRefunds(UUID currentUserId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        return refundRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RefundResponse mapToResponse(Refund r) {
        return new RefundResponse(
                r.getId(),
                r.getTransaction().getId(),
                r.getTransaction().getTransactionReference(),
                r.getAmount(),
                r.getReason(),
                r.getStatus().name(),
                r.getRejectedReason(),
                r.getCreatedAt()
        );
    }

    private void validateRole(UUID merchantId, UUID userId, MerchantRoleName... allowedRoles) {
        MerchantEmployee emp = merchantEmployeeRepository.findByMerchantIdAndUserId(merchantId, userId)
                .orElseThrow(() -> new BusinessException("You are not an employee of this business."));
        
        boolean authorized = java.util.Arrays.stream(allowedRoles)
                .anyMatch(r -> emp.getRole().getName() == r);
        
        if (!authorized) {
            throw new BusinessException("Unauthorized action for your role.");
        }
    }
}
