package com.apexpay.service;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.IdempotencyKeyRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletLedgerRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.repository.UpiIdRepository;
import com.apexpay.service.NotificationService;
import com.apexpay.service.impl.PaymentServiceImpl;
import com.apexpay.service.impl.ValidationServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PaymentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletLedgerRepository walletLedgerRepository;

    @Mock
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Mock
    private WalletTransferService walletTransferService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private AuditService auditService;

    @Mock
    private UpiIdRepository upiIdRepository;

    @Mock
    private NotificationService notificationService;

    private ValidationService validationService;
    private PaymentService paymentService;

    private User senderUser;
    private User receiverUser;
    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        validationService = new ValidationServiceImpl(userRepository, walletRepository, walletLedgerRepository, idempotencyKeyRepository);
        paymentService = new PaymentServiceImpl(
                validationService, walletTransferService, transactionService, auditService,
                idempotencyKeyRepository, walletRepository, userRepository, walletLedgerRepository, new ObjectMapper(),
                upiIdRepository, notificationService
        );

        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();

        senderUser = new User();
        senderUser.setId(senderId);
        senderUser.setFullName("Sender User");
        senderUser.setUsername("sender");
        senderUser.setEmail("sender@apexpay.com");
        senderUser.setMobileNumber("+1234567890");
        senderUser.setAccountStatus(AccountStatus.ACTIVE);

        receiverUser = new User();
        receiverUser.setId(receiverId);
        receiverUser.setFullName("Receiver User");
        receiverUser.setUsername("receiver");
        receiverUser.setEmail("receiver@apexpay.com");
        receiverUser.setMobileNumber("+1987654321");
        receiverUser.setAccountStatus(AccountStatus.ACTIVE);

        senderWallet = new Wallet();
        senderWallet.setId(UUID.randomUUID());
        senderWallet.setUser(senderUser);
        senderWallet.setWalletNumber("APXSENDER123");
        senderWallet.setBalance(new BigDecimal("500.00"));
        senderWallet.setWalletStatus(WalletStatus.ACTIVE);
        senderWallet.setCurrency("USD");
        senderWallet.setDailyTransferLimit(new BigDecimal("1000.00"));
        senderWallet.setMonthlyTransferLimit(new BigDecimal("5000.00"));

        receiverWallet = new Wallet();
        receiverWallet.setId(UUID.randomUUID());
        receiverWallet.setUser(receiverUser);
        receiverWallet.setWalletNumber("APXRECEIVER123");
        receiverWallet.setBalance(new BigDecimal("100.00"));
        receiverWallet.setWalletStatus(WalletStatus.ACTIVE);
        receiverWallet.setCurrency("USD");
    }

    @Test
    void validateTransfer_ShouldPass_WhenRequestIsValid() {
        SendMoneyRequest request = new SendMoneyRequest("receiver", new BigDecimal("50.00"), "Lunch", "idemp-key-1");

        when(walletRepository.findByUserId(senderUser.getId())).thenReturn(Optional.of(senderWallet));
        when(userRepository.findByUsername("receiver")).thenReturn(Optional.of(receiverUser));
        when(walletRepository.findByUserId(receiverUser.getId())).thenReturn(Optional.of(receiverWallet));
        when(walletLedgerRepository.findByWalletIdAndTimestampAfter(any(), any())).thenReturn(new ArrayList<>());

        assertDoesNotThrow(() -> validationService.validateTransfer(senderUser.getId(), request));
    }

    @Test
    void validateTransfer_ShouldThrowException_WhenSenderHasInsufficientBalance() {
        SendMoneyRequest request = new SendMoneyRequest("receiver", new BigDecimal("600.00"), "Rent", "idemp-key-2");

        when(walletRepository.findByUserId(senderUser.getId())).thenReturn(Optional.of(senderWallet));
        when(userRepository.findByUsername("receiver")).thenReturn(Optional.of(receiverUser));
        when(walletRepository.findByUserId(receiverUser.getId())).thenReturn(Optional.of(receiverWallet));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                validationService.validateTransfer(senderUser.getId(), request));
        assertEquals("Insufficient wallet balance.", exception.getMessage());
    }

    @Test
    void validateTransfer_ShouldThrowException_WhenSelfTransferRequested() {
        SendMoneyRequest request = new SendMoneyRequest("sender", new BigDecimal("50.00"), "Self", "idemp-key-3");

        when(walletRepository.findByUserId(senderUser.getId())).thenReturn(Optional.of(senderWallet));
        when(userRepository.findByUsername("sender")).thenReturn(Optional.of(senderUser));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                validationService.validateTransfer(senderUser.getId(), request));
        assertEquals("Self transfers are not permitted.", exception.getMessage());
    }

    @Test
    void validateTransfer_ShouldThrowException_WhenSenderWalletFrozen() {
        senderWallet.setWalletStatus(WalletStatus.FROZEN);
        SendMoneyRequest request = new SendMoneyRequest("receiver", new BigDecimal("50.00"), "Frozen Test", "idemp-key-4");

        when(walletRepository.findByUserId(senderUser.getId())).thenReturn(Optional.of(senderWallet));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                validationService.validateTransfer(senderUser.getId(), request));
        assertTrue(exception.getMessage().contains("Sender wallet is FROZEN"));
    }

    @Test
    void validateTransfer_ShouldThrowException_WhenAmountIsZeroOrNegative() {
        SendMoneyRequest request = new SendMoneyRequest("receiver", new BigDecimal("-5.00"), "Negative amount", "idemp-key-5");

        BusinessException exception = assertThrows(BusinessException.class, () ->
                validationService.validateTransfer(senderUser.getId(), request));
        assertEquals("Payment amount must be positive and greater than zero.", exception.getMessage());
    }
}
