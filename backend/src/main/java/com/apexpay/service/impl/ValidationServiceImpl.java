package com.apexpay.service.impl;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.entity.IdempotencyKey;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.WalletLedger;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.IdempotencyKeyRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletLedgerRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.ValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ValidationServiceImpl implements ValidationService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;

    public ValidationServiceImpl(UserRepository userRepository,
                                 WalletRepository walletRepository,
                                 WalletLedgerRepository walletLedgerRepository,
                                 IdempotencyKeyRepository idempotencyKeyRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateTransfer(UUID senderUserId, SendMoneyRequest request) {
        // 1. Positive Amount check
        BigDecimal amount = request.amount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Payment amount must be positive and greater than zero.");
        }

        // 2. Minimum/Maximum amount checks
        BigDecimal minAmount = new BigDecimal("0.0100");
        BigDecimal maxAmount = new BigDecimal("10000.0000"); // Protection limit
        if (amount.compareTo(minAmount) < 0) {
            throw new BusinessException("Minimum transfer amount is " + minAmount);
        }
        if (amount.compareTo(maxAmount) > 0) {
            throw new BusinessException("Maximum single transfer amount is " + maxAmount);
        }

        // 3. Sender Wallet Validation
        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender wallet not found."));
        if (senderWallet.getWalletStatus() != WalletStatus.ACTIVE) {
            throw new BusinessException("Sender wallet is " + senderWallet.getWalletStatus() + ". Transfers are blocked.");
        }

        // 4. Receiver Wallet Validation
        String recipient = request.recipientIdentifier().trim();
        Wallet receiverWallet = null;

        // Recipient could be mobile number, email, username or wallet number
        if (recipient.contains("@")) {
            // Email search
            User user = userRepository.findByEmail(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user with email not found."));
            receiverWallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
        } else if (recipient.startsWith("APX") || (recipient.length() >= 10 && recipient.matches("[A-Z0-9]+"))) {
            // Wallet Number search
            receiverWallet = walletRepository.findByWalletNumber(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found with wallet number."));
        } else if (recipient.matches("^\\+?[1-9]\\d{1,14}$")) {
            // Mobile Number search
            User user = userRepository.findByMobileNumber(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user with mobile number not found."));
            receiverWallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
        } else {
            // Default to Username search
            User user = userRepository.findByUsername(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user with username not found."));
            receiverWallet = walletRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
        }

        // 5. Prevent Self Transfer
        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new BusinessException("Self transfers are not permitted.");
        }

        // 6. Verify Receiver Wallet Status
        if (receiverWallet.getWalletStatus() != WalletStatus.ACTIVE) {
            throw new BusinessException("Recipient wallet is frozen or inactive. Status: " + receiverWallet.getWalletStatus());
        }

        // 7. Validate Sender Available Balance
        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient wallet balance.");
        }

        // 8. Validate Daily Transfer Limit
        LocalDateTime startOfToday = LocalDateTime.now().with(LocalTime.MIN);
        List<WalletLedger> todayEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(senderWallet.getId(), startOfToday);
        BigDecimal todaySpentTransfers = todayEntries.stream()
                .filter(e -> "TRANSFER".equalsIgnoreCase(e.getTransactionType()) 
                        && "DEBIT".equalsIgnoreCase(e.getDirection()) 
                        && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (todaySpentTransfers.add(amount).compareTo(senderWallet.getDailyTransferLimit()) > 0) {
            throw new BusinessException("Daily transfer limit exceeded. Remaining limit: " +
                    senderWallet.getDailyTransferLimit().subtract(todaySpentTransfers));
        }

        // 9. Validate Monthly Transfer Limit
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);
        List<WalletLedger> monthEntries = walletLedgerRepository.findByWalletIdAndTimestampAfter(senderWallet.getId(), startOfMonth);
        BigDecimal monthlySpentTransfers = monthEntries.stream()
                .filter(e -> "TRANSFER".equalsIgnoreCase(e.getTransactionType()) 
                        && "DEBIT".equalsIgnoreCase(e.getDirection()) 
                        && "SUCCESS".equalsIgnoreCase(e.getStatus()))
                .map(WalletLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (monthlySpentTransfers.add(amount).compareTo(senderWallet.getMonthlyTransferLimit()) > 0) {
            throw new BusinessException("Monthly transfer limit exceeded. Remaining limit: " +
                    senderWallet.getMonthlyTransferLimit().subtract(monthlySpentTransfers));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void validateIdempotency(String idempotencyKey) {
        if (idempotencyKeyRepository.existsById(idempotencyKey)) {
            throw new BusinessException("Duplicate request. Transaction is already processed or is processing.");
        }
    }
}
