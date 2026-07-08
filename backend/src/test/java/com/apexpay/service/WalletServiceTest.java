package com.apexpay.service;

import com.apexpay.dto.AddMoneyRequest;
import com.apexpay.dto.AddMoneyResponse;
import com.apexpay.dto.WithdrawRequest;
import com.apexpay.dto.WithdrawResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.WalletLedger;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.WalletLedgerRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.impl.WalletServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletLedgerRepository walletLedgerRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WalletServiceImpl walletService;

    private UUID userId;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userId = UUID.randomUUID();
        
        wallet = new Wallet();
        wallet.setId(UUID.randomUUID());
        wallet.setWalletNumber("APXTESTWALLET123");
        wallet.setBalance(new BigDecimal("100.0000"));
        wallet.setCurrency("USD");
        wallet.setWalletStatus(WalletStatus.ACTIVE);
        wallet.setDailyWithdrawalLimit(new BigDecimal("500.0000"));
        wallet.setMonthlyWithdrawalLimit(new BigDecimal("2500.0000"));
    }

    @Test
    void addMoney_ShouldIncreaseBalance_WhenRequestIsValid() {
        AddMoneyRequest request = new AddMoneyRequest(new BigDecimal("50.0000"), "Bank Direct");
        
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenReturn(wallet);

        AddMoneyResponse response = walletService.addMoney(userId, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("150.0000"), response.balanceAfter());
        assertEquals(new BigDecimal("50.0000"), response.amount());
        assertEquals("SUCCESS", response.status());
        verify(walletLedgerRepository, times(1)).save(any(WalletLedger.class));
        verify(auditService, times(1)).log(eq("WALLET_ADD_MONEY"), eq(userId), eq("Wallet"), eq(wallet.getId()));
    }

    @Test
    void addMoney_ShouldThrowException_WhenWalletIsInactive() {
        wallet.setWalletStatus(WalletStatus.FROZEN);
        AddMoneyRequest request = new AddMoneyRequest(new BigDecimal("50.0000"), "Bank Direct");
        
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));

        assertThrows(BusinessException.class, () -> walletService.addMoney(userId, request));
    }

    @Test
    void withdraw_ShouldDecreaseBalance_WhenWithinLimitsAndSufficientBalance() {
        WithdrawRequest request = new WithdrawRequest(new BigDecimal("40.0000"));
        
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(walletLedgerRepository.findByWalletIdAndTimestampAfter(eq(wallet.getId()), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(walletRepository.save(any(Wallet.class))).thenReturn(wallet);

        WithdrawResponse response = walletService.withdraw(userId, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("60.0000"), response.balanceAfter());
        assertEquals(new BigDecimal("40.0000"), response.amount());
        assertEquals("SUCCESS", response.status());
        verify(walletLedgerRepository, times(1)).save(any(WalletLedger.class));
    }

    @Test
    void withdraw_ShouldThrowException_WhenBalanceIsInsufficient() {
        WithdrawRequest request = new WithdrawRequest(new BigDecimal("150.0000"));
        
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));

        assertThrows(BusinessException.class, () -> walletService.withdraw(userId, request));
    }

    @Test
    void withdraw_ShouldThrowException_WhenDailyWithdrawalLimitIsExceeded() {
        WithdrawRequest request = new WithdrawRequest(new BigDecimal("450.0050"));
        
        // Already withdrew $100 today
        WalletLedger pastLedger = new WalletLedger();
        pastLedger.setTransactionType("WITHDRAWAL");
        pastLedger.setStatus("SUCCESS");
        pastLedger.setAmount(new BigDecimal("100.0000"));

        wallet.setBalance(new BigDecimal("1000.0000")); // has enough money

        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(walletLedgerRepository.findByWalletIdAndTimestampAfter(eq(wallet.getId()), any(LocalDateTime.class)))
                .thenReturn(List.of(pastLedger));

        // Daily limit is $500. $100 + $450 = $550 which is > 500
        assertThrows(BusinessException.class, () -> walletService.withdraw(userId, request));
    }
}
