package com.apexpay.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import com.apexpay.dto.AddMoneyRequest;
import com.apexpay.dto.AddMoneyResponse;
import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.WalletBalanceResponse;
import com.apexpay.dto.WalletLedgerResponse;
import com.apexpay.dto.WalletResponse;
import com.apexpay.dto.WithdrawRequest;
import com.apexpay.dto.WithdrawResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.WalletService;

@SuppressWarnings("null")
class WalletControllerTest {

    @Mock
    private WalletService walletService;

    @InjectMocks
    private WalletController walletController;

    private UserPrincipal userPrincipal;
    private UUID userId;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userId = UUID.randomUUID();
        userPrincipal = new UserPrincipal(
                userId,
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                "passwordHash",
                Collections.emptyList()
        );
    }

    @Test
    void getWallet_ShouldReturnWallet_WhenAuthorized() {
        WalletResponse mockWallet = new WalletResponse(
                UUID.randomUUID(),
                "APX1234567890",
                new BigDecimal("150.0000"),
                "USD",
                "ACTIVE",
                new BigDecimal("1000.00"),
                new BigDecimal("500.00"),
                new BigDecimal("5000.00"),
                new BigDecimal("2500.00"),
                LocalDateTime.now()
        );

        when(walletService.getWallet(userId)).thenReturn(mockWallet);

        ResponseEntity<ApiResponse<WalletResponse>> response = walletController.getWallet(userPrincipal);

        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals("APX1234567890", response.getBody().data().walletNumber());
        verify(walletService, times(1)).getWallet(userId);
    }

    @Test
    void getBalance_ShouldReturnBalance_WhenRequested() {
        WalletBalanceResponse mockBalance = new WalletBalanceResponse(new BigDecimal("150.00"), "USD");
        when(walletService.getBalance(userId)).thenReturn(mockBalance);

        ResponseEntity<ApiResponse<WalletBalanceResponse>> response = walletController.getBalance(userPrincipal);

        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals(new BigDecimal("150.00"), response.getBody().data().availableBalance());
    }

    @Test
    void addMoney_ShouldProcessSimulatedAddition_WhenValid() {
        AddMoneyRequest request = new AddMoneyRequest(new BigDecimal("50.00"), "Card direct");
        AddMoneyResponse mockResponse = new AddMoneyResponse(
                "TXN-ADD-123",
                new BigDecimal("50.00"),
                new BigDecimal("200.00"),
                LocalDateTime.now(),
                "SUCCESS",
                "Add money: Card direct"
        );

        when(walletService.addMoney(eq(userId), any(AddMoneyRequest.class))).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<AddMoneyResponse>> response = walletController.addMoney(userPrincipal, request);

        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals("TXN-ADD-123", response.getBody().data().transactionReference());
        verify(walletService, times(1)).addMoney(eq(userId), any(AddMoneyRequest.class));
    }

    @Test
    void withdraw_ShouldProcessSimulatedWithdrawal_WhenValid() {
        WithdrawRequest request = new WithdrawRequest(new BigDecimal("20.00"));
        WithdrawResponse mockResponse = new WithdrawResponse(
                "TXN-WTH-123",
                new BigDecimal("20.00"),
                new BigDecimal("130.00"),
                LocalDateTime.now(),
                "SUCCESS",
                "Withdrawal to linked funding bank"
        );

        when(walletService.withdraw(eq(userId), any(WithdrawRequest.class))).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<WithdrawResponse>> response = walletController.withdraw(userPrincipal, request);

        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals("TXN-WTH-123", response.getBody().data().transactionReference());
        verify(walletService, times(1)).withdraw(eq(userId), any(WithdrawRequest.class));
    }

    @Test
    void getLedger_ShouldReturnEntries_WhenRequested() {
        WalletLedgerResponse mockLedgerEntry = new WalletLedgerResponse(
                UUID.randomUUID(),
                "TXN-ADD-123",
                "ADD_MONEY",
                new BigDecimal("50.00"),
                new BigDecimal("100.00"),
                new BigDecimal("150.00"),
                LocalDateTime.now(),
                "Add money: Card direct",
                "SUCCESS"
        );

        when(walletService.getLedger(userId)).thenReturn(List.of(mockLedgerEntry));

        ResponseEntity<ApiResponse<List<WalletLedgerResponse>>> response = walletController.getLedger(userPrincipal);

        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals(1, response.getBody().data().size());
        assertEquals("TXN-ADD-123", response.getBody().data().get(0).referenceNumber());
    }
}
