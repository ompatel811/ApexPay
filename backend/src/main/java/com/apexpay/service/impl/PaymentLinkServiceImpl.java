package com.apexpay.service.impl;

import com.apexpay.dto.CreatePaymentLinkRequest;
import com.apexpay.dto.PaymentLinkResponse;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.entity.enums.PaymentLinkStatus;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.*;
import com.apexpay.service.LedgerService;
import com.apexpay.service.MerchantService;
import com.apexpay.service.NotificationService;
import com.apexpay.service.PaymentLinkService;
import com.apexpay.service.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PaymentLinkServiceImpl implements PaymentLinkService {

    private final PaymentLinkRepository paymentLinkRepository;
    private final MerchantRepository merchantRepository;
    private final MerchantService merchantService;
    private final WalletRepository walletRepository;
    private final TransactionService transactionService;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;
    private final IdempotencyKeyRepository idempotencyKeyRepository;

    public PaymentLinkServiceImpl(PaymentLinkRepository paymentLinkRepository,
                                  MerchantRepository merchantRepository,
                                  MerchantService merchantService,
                                  WalletRepository walletRepository,
                                  TransactionService transactionService,
                                  LedgerService ledgerService,
                                  NotificationService notificationService,
                                  IdempotencyKeyRepository idempotencyKeyRepository) {
        this.paymentLinkRepository = paymentLinkRepository;
        this.merchantRepository = merchantRepository;
        this.merchantService = merchantService;
        this.walletRepository = walletRepository;
        this.transactionService = transactionService;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
    }

    @Override
    @Transactional
    public PaymentLinkResponse createPaymentLink(UUID currentUserId, CreatePaymentLinkRequest request) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        log.info("Creating payment link for merchant: {}, amount: {}", merchant.getBusinessName(), request.amount());

        PaymentLink paymentLink = new PaymentLink();
        paymentLink.setMerchant(merchant);
        
        // Generate random short reference number, e.g. PL-ABC123XYZ
        String reference = "PL-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        paymentLink.setReferenceNumber(reference);
        
        paymentLink.setAmount(request.amount());
        paymentLink.setCurrency(request.currency());
        paymentLink.setExpiry(LocalDateTime.now().plusHours(request.expiryHours()));
        paymentLink.setDescription(request.description());
        paymentLink.setStatus(PaymentLinkStatus.PENDING);
        paymentLink.setCustomerName(request.customerName());
        paymentLink.setCustomerEmail(request.customerEmail());
        paymentLink.setCustomerMobile(request.customerMobile());

        paymentLink = paymentLinkRepository.save(paymentLink);

        return mapToResponse(paymentLink);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> getPaymentLinks(UUID currentUserId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        return paymentLinkRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentLinkResponse getPaymentLinkByReference(String referenceNumber) {
        PaymentLink link = paymentLinkRepository.findByReferenceNumber(referenceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment link not found. Reference: " + referenceNumber));
        
        // Auto-check expiry
        if (link.getStatus() == PaymentLinkStatus.PENDING && link.getExpiry().isBefore(LocalDateTime.now())) {
            link.setStatus(PaymentLinkStatus.EXPIRED);
            paymentLinkRepository.save(link);
        }

        return mapToResponse(link);
    }

    @Override
    @Transactional
    public SendMoneyResponse payPaymentLink(String referenceNumber, UUID customerUserId, String idempotencyKey) {
        log.info("Processing payment link check for reference: {}, customer: {}", referenceNumber, customerUserId);

        // 1. Idempotency Check
        if (idempotencyKey != null) {
            Optional<IdempotencyKey> existingKeyOpt = idempotencyKeyRepository.findById(idempotencyKey);
            if (existingKeyOpt.isPresent()) {
                throw new BusinessException("Duplicate payment request detected.");
            }
            idempotencyKeyRepository.save(new IdempotencyKey(idempotencyKey, "SUCCESS"));
        }

        // 2. Fetch and Validate Payment Link
        PaymentLink link = paymentLinkRepository.findByReferenceNumber(referenceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment link not found."));

        if (link.getStatus() != PaymentLinkStatus.PENDING) {
            throw new BusinessException("This payment link is no longer active. Status: " + link.getStatus());
        }

        if (link.getExpiry().isBefore(LocalDateTime.now())) {
            link.setStatus(PaymentLinkStatus.EXPIRED);
            paymentLinkRepository.save(link);
            throw new BusinessException("This payment link has expired.");
        }

        // 3. Resolve wallets
        Wallet customerWallet = walletRepository.findByUserId(customerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer wallet not found."));

        Merchant merchant = link.getMerchant();
        Wallet merchantShadowWallet = walletRepository.findByWalletNumber(merchant.getWallet().getWalletNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant receiver wallet not found."));

        // 4. Pessimistic lock wallets in sorted order to prevent deadlocks
        Wallet lockedSender;
        Wallet lockedReceiver;

        if (customerWallet.getId().compareTo(merchantShadowWallet.getId()) < 0) {
            lockedSender = walletRepository.findByIdForUpdate(customerWallet.getId()).orElseThrow();
            lockedReceiver = walletRepository.findByIdForUpdate(merchantShadowWallet.getId()).orElseThrow();
        } else {
            lockedReceiver = walletRepository.findByIdForUpdate(merchantShadowWallet.getId()).orElseThrow();
            lockedSender = walletRepository.findByIdForUpdate(customerWallet.getId()).orElseThrow();
        }

        BigDecimal amount = link.getAmount();

        if (lockedSender.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient wallet balance to pay this invoice.");
        }

        // 5. Deduct customer balance & Credit merchant balance
        lockedSender.setBalance(lockedSender.getBalance().subtract(amount));
        lockedReceiver.setBalance(lockedReceiver.getBalance().add(amount));

        walletRepository.save(lockedSender);
        walletRepository.save(lockedReceiver);

        // 6. Create successful Transaction record
        Transaction tx = transactionService.createTransaction(
                lockedSender, lockedReceiver, amount,
                TransactionType.TRANSFER, TransactionStatus.SUCCESS,
                "Payment Link Invoice " + link.getReferenceNumber()
        );

        // 7. Write Ledger entries
        ledgerService.createLedgerEntries(tx, lockedSender, lockedReceiver, amount);

        // 8. Update Payment Link Status
        link.setStatus(PaymentLinkStatus.SUCCESS);
        link.setTransaction(tx);
        paymentLinkRepository.save(link);

        // 9. Send live WebSocket and email notifications
        try {
            // Customer notification
            notificationService.sendNotification(
                    lockedSender.getUser(),
                    "Payment Sent Successfully",
                    String.format("You successfully paid $%s to %s. Ref: %s", amount, merchant.getBusinessName(), tx.getTransactionReference()),
                    NotificationType.PAYMENT_SUCCESS
            );
            // Merchant owner notification
            notificationService.sendNotification(
                    merchant.getOwner(),
                    "Payment Received",
                    String.format("Your business '%s' received $%s from %s. Ref: %s", merchant.getBusinessName(), amount, lockedSender.getUser().getFullName(), tx.getTransactionReference()),
                    NotificationType.PAYMENT_RECEIVED
            );
        } catch (Exception e) {
            log.error("Failed to send payment link success notifications", e);
        }

        return new SendMoneyResponse(
                tx.getTransactionReference(),
                tx.getId(),
                tx.getPaymentStatus().name(),
                tx.getAmount(),
                lockedSender.getCurrency(),
                lockedSender.getWalletNumber(),
                lockedReceiver.getWalletNumber(),
                tx.getCreatedAt(),
                tx.getRemarks()
        );
    }

    private PaymentLinkResponse mapToResponse(PaymentLink l) {
        return new PaymentLinkResponse(
                l.getId(), l.getReferenceNumber(), l.getAmount(), l.getCurrency(),
                l.getExpiry(), l.getDescription(), l.getStatus().name(),
                l.getCustomerName(), l.getCustomerEmail(), l.getCustomerMobile(),
                "/pay/" + l.getReferenceNumber(),
                l.getTransaction() != null ? l.getTransaction().getId() : null,
                l.getMerchant().getBusinessName(), l.getCreatedAt()
        );
    }
}
