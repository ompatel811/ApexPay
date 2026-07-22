package com.apexpay.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.dto.BankAccountResponse;
import com.apexpay.dto.LinkBankAccountRequest;
import com.apexpay.entity.BankAccount;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.entity.enums.VerificationStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.BankAccountRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.BankAccountService;
import com.apexpay.service.NotificationService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Autowired
    public BankAccountServiceImpl(BankAccountRepository bankAccountRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService,
                                  AuditService auditService) {
        this.bankAccountRepository = bankAccountRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public BankAccountResponse linkBankAccount(UUID userId, LinkBankAccountRequest request) {
        log.info("Linking bank account for user: {}, Bank: {}", userId, request.bankName());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        // 1. Duplicate check
        if (bankAccountRepository.existsByUserIdAndAccountNumber(userId, request.accountNumber())) {
            throw new BusinessException("Duplicate bank account detected. This account is already linked.");
        }

        // 2. Validate IFSC format (handled by DTO annotation but double check)
        if (request.ifsc() == null || !request.ifsc().matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            throw new BusinessException("Invalid IFSC code format.");
        }

        // 3. Mask Account Number
        String accountNumber = request.accountNumber();
        String masked = maskAccountNumber(accountNumber);

        // 4. Determine if primary: set to true if it is the first account
        boolean isFirstAccount = bankAccountRepository.findByUserId(userId).isEmpty();

        BankAccount bankAccount = new BankAccount();
        bankAccount.setUser(user);
        bankAccount.setBankName(request.bankName());
        bankAccount.setAccountHolderName(request.accountHolderName());
        bankAccount.setAccountNumber(accountNumber);
        bankAccount.setMaskedAccountNumber(masked);
        bankAccount.setIfsc(request.ifsc());
        bankAccount.setBranch(request.branch());
        bankAccount.setAccountType(request.accountType());
        bankAccount.setIsPrimary(isFirstAccount);
        bankAccount.setVerificationStatus(VerificationStatus.VERIFIED); // Auto-verify simulation
        bankAccount.setCreatedAt(LocalDateTime.now());
        bankAccount.setUpdatedAt(LocalDateTime.now());

        bankAccount = bankAccountRepository.save(bankAccount);

        // Trigger Audit Log
        auditService.log("BANK_ACCOUNT_LINKED", userId, "BankAccount", bankAccount.getId());

        // Send In-App & WS Notification
        String msg = String.format("Bank account linked successfully: %s (%s)", request.bankName(), masked);
        notificationService.sendNotification(user, "Bank Account Linked", msg, NotificationType.BANK_LINKED);

        return mapToResponse(bankAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getBankAccounts(UUID userId) {
        log.info("Fetching linked bank accounts for user: {}", userId);
        return bankAccountRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BankAccountResponse setPrimaryBankAccount(UUID accountId, UUID userId) {
        log.info("Setting account {} as primary for user {}", accountId, userId);
        
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found."));

        if (!account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to access this bank account.");
        }

        // Remove primary flag from previous primary account
        Optional<BankAccount> currentPrimaryOpt = bankAccountRepository.findByUserIdAndIsPrimaryTrue(userId);
        if (currentPrimaryOpt.isPresent()) {
            BankAccount currentPrimary = currentPrimaryOpt.get();
            currentPrimary.setIsPrimary(false);
            currentPrimary.setUpdatedAt(LocalDateTime.now());
            bankAccountRepository.save(currentPrimary);
        }

        account.setIsPrimary(true);
        account.setUpdatedAt(LocalDateTime.now());
        BankAccount updated = bankAccountRepository.save(account);

        auditService.log("BANK_PRIMARY_UPDATED", userId, "BankAccount", updated.getId());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBankAccount(UUID accountId, UUID userId) {
        log.info("Removing bank account {} for user {}", accountId, userId);
        
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found."));

        if (!account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to modify this bank account.");
        }

        boolean wasPrimary = account.getIsPrimary();
        bankAccountRepository.delete(account);

        // If we deleted the primary account, assign another as primary if exists
        if (wasPrimary) {
            List<BankAccount> remaining = bankAccountRepository.findByUserId(userId);
            if (!remaining.isEmpty()) {
                BankAccount newPrimary = remaining.get(0);
                newPrimary.setIsPrimary(true);
                newPrimary.setUpdatedAt(LocalDateTime.now());
                bankAccountRepository.save(newPrimary);
            }
        }

        auditService.log("BANK_ACCOUNT_REMOVED", userId, "BankAccount", accountId);

        // In-App Notification
        User user = userRepository.findById(userId).orElseThrow();
        String msg = String.format("Bank account removed: %s (%s)", account.getBankName(), account.getMaskedAccountNumber());
        notificationService.sendNotification(user, "Bank Account Removed", msg, NotificationType.BANK_REMOVED);
    }

    private String maskAccountNumber(String accNumber) {
        if (accNumber == null || accNumber.length() < 4) {
            return "XXXX";
        }
        String lastFour = accNumber.substring(accNumber.length() - 4);
        return "XXXX-XXXX-" + lastFour;
    }

    private BankAccountResponse mapToResponse(BankAccount account) {
        return new BankAccountResponse(
                account.getId(),
                account.getBankName(),
                account.getAccountHolderName(),
                account.getAccountNumber(), // Keep for response as is (could mask depending on security requirements, but DTO representation is standard)
                account.getMaskedAccountNumber(),
                account.getIfsc(),
                account.getBranch(),
                account.getAccountType(),
                account.getIsPrimary(),
                account.getVerificationStatus(),
                account.getCreatedAt()
        );
    }
}
