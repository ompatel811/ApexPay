package com.apexpay.service.impl;

import com.apexpay.dto.SettlementResponse;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.entity.enums.MerchantRoleName;
import com.apexpay.entity.enums.SettlementStatus;
import com.apexpay.entity.enums.SettlementType;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.*;
import com.apexpay.service.LedgerService;
import com.apexpay.service.MerchantService;
import com.apexpay.service.NotificationService;
import com.apexpay.service.SettlementService;
import com.apexpay.service.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SettlementServiceImpl implements SettlementService {

    private final SettlementRepository settlementRepository;
    private final MerchantService merchantService;
    private final MerchantRepository merchantRepository;
    private final MerchantWalletRepository merchantWalletRepository;
    private final WalletRepository walletRepository;
    private final TransactionService transactionService;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;
    private final MerchantEmployeeRepository merchantEmployeeRepository;

    public SettlementServiceImpl(SettlementRepository settlementRepository,
                                 MerchantService merchantService,
                                 MerchantRepository merchantRepository,
                                 MerchantWalletRepository merchantWalletRepository,
                                 WalletRepository walletRepository,
                                 TransactionService transactionService,
                                 LedgerService ledgerService,
                                 NotificationService notificationService,
                                 MerchantEmployeeRepository merchantEmployeeRepository) {
        this.settlementRepository = settlementRepository;
        this.merchantService = merchantService;
        this.merchantRepository = merchantRepository;
        this.merchantWalletRepository = merchantWalletRepository;
        this.walletRepository = walletRepository;
        this.transactionService = transactionService;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
        this.merchantEmployeeRepository = merchantEmployeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementResponse> getSettlements(UUID currentUserId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        return settlementRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SettlementResponse triggerManualSettlement(UUID currentUserId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN, MerchantRoleName.MANAGER);

        MerchantWallet mWallet = merchantWalletRepository.findByMerchantId(merchant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant wallet not found."));

        // Load core wallet
        Wallet shadowWallet = walletRepository.findByIdForUpdate(
                walletRepository.findByWalletNumber(mWallet.getWalletNumber())
                        .orElseThrow(() -> new ResourceNotFoundException("Shadow wallet not found."))
                        .getId()
        ).orElseThrow();

        BigDecimal balance = shadowWallet.getBalance();

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("No funds available in your balance for settlement.");
        }

        // Payout balance
        shadowWallet.setBalance(BigDecimal.ZERO);
        walletRepository.save(shadowWallet);

        // Generate Settlement Reference
        String ref = "SET-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        Settlement settlement = new Settlement();
        settlement.setMerchant(merchant);
        settlement.setReferenceNumber(ref);
        settlement.setAmount(balance);
        settlement.setCurrency(mWallet.getCurrency());
        settlement.setSettlementType(SettlementType.DAILY);
        settlement.setStatus(SettlementStatus.SETTLED);
        settlement.setSettledAt(LocalDateTime.now());
        settlement = settlementRepository.save(settlement);

        // Record Withdrawal transaction in ledger
        Transaction tx = transactionService.createTransaction(
                shadowWallet, null, balance,
                TransactionType.WITHDRAW, TransactionStatus.SUCCESS,
                "Settlement Payout " + ref
        );
        ledgerService.createLedgerEntries(tx, shadowWallet, null, balance);

        try {
            notificationService.sendNotification(
                    merchant.getOwner(),
                    "Settlement Processed",
                    String.format("A manual settlement payout of $%s has been processed to your bank. Ref: %s", balance, ref),
                    NotificationType.SYSTEM_NOTIFICATION
            );
        } catch (Exception e) {
            log.error("Failed to notify settlement success", e);
        }

        return mapToResponse(settlement);
    }

    @Override
    @Transactional
    public void simulateSettlementsJob() {
        log.info("Starting background settlements simulation job.");
        List<Merchant> merchants = merchantRepository.findAll();
        for (Merchant merchant : merchants) {
            try {
                MerchantWallet mWallet = merchantWalletRepository.findByMerchantId(merchant.getId()).orElse(null);
                if (mWallet == null) continue;

                Wallet shadowWallet = walletRepository.findByWalletNumber(mWallet.getWalletNumber()).orElse(null);
                if (shadowWallet == null) continue;

                BigDecimal balance = shadowWallet.getBalance();
                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    log.info("Auto-settling merchant: {}, balance: {}", merchant.getBusinessName(), balance);
                    shadowWallet.setBalance(BigDecimal.ZERO);
                    walletRepository.save(shadowWallet);

                    String ref = "SET-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
                    Settlement settlement = new Settlement();
                    settlement.setMerchant(merchant);
                    settlement.setReferenceNumber(ref);
                    settlement.setAmount(balance);
                    settlement.setCurrency(mWallet.getCurrency());
                    settlement.setSettlementType(SettlementType.DAILY);
                    settlement.setStatus(SettlementStatus.SETTLED);
                    settlement.setSettledAt(LocalDateTime.now());
                    settlementRepository.save(settlement);

                    Transaction tx = transactionService.createTransaction(
                            shadowWallet, null, balance,
                            TransactionType.WITHDRAW, TransactionStatus.SUCCESS,
                            "Auto-Settlement " + ref
                    );
                    ledgerService.createLedgerEntries(tx, shadowWallet, null, balance);

                    notificationService.sendNotification(
                            merchant.getOwner(),
                            "Auto-Settlement Settled",
                            String.format("Automated daily settlement of $%s completed. Ref: %s", balance, ref),
                            NotificationType.SYSTEM_NOTIFICATION
                    );
                }
            } catch (Exception e) {
                log.error("Failed to execute auto-settlement for merchant: {}", merchant.getBusinessName(), e);
            }
        }
    }

    private SettlementResponse mapToResponse(Settlement s) {
        return new SettlementResponse(
                s.getId(), s.getReferenceNumber(), s.getAmount(), s.getCurrency(),
                s.getSettlementType().name(), s.getStatus().name(), s.getSettledAt(), s.getCreatedAt()
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
