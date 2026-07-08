package com.apexpay.service;

import com.apexpay.dto.AnalyticsDashboardResponse;
import com.apexpay.dto.IncomeAnalyticsResponse;
import com.apexpay.dto.SpendingAnalyticsResponse;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UpiRequestRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.impl.AnalyticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AnalyticsServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private UpiRequestRepository upiRequestRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private User user;
    private UUID userId;
    private Wallet wallet;

    private User otherUser;
    private Wallet otherWallet;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setFullName("John Doe");

        wallet = new Wallet();
        wallet.setUser(user);
        wallet.setBalance(new BigDecimal("1000.00"));

        otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setFullName("Other User");

        otherWallet = new Wallet();
        otherWallet.setUser(otherUser);
    }

    @Test
    void getDashboardMetrics_Success() {
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));

        List<Transaction> txs = new ArrayList<>();
        
        // Outbound transaction (debit)
        Transaction t1 = new Transaction();
        t1.setAmount(new BigDecimal("100.00"));
        t1.setSenderWallet(wallet);
        t1.setReceiverWallet(otherWallet);
        t1.setPaymentStatus(TransactionStatus.SUCCESS);
        t1.setCreatedAt(LocalDateTime.now());
        txs.add(t1);

        // Inbound transaction (credit)
        Transaction t2 = new Transaction();
        t2.setAmount(new BigDecimal("250.00"));
        t2.setSenderWallet(otherWallet);
        t2.setReceiverWallet(wallet);
        t2.setPaymentStatus(TransactionStatus.SUCCESS);
        t2.setCreatedAt(LocalDateTime.now());
        txs.add(t2);

        when(transactionRepository.findAllTransactionsByUserId(userId)).thenReturn(txs);
        when(upiRequestRepository.findByPayerIdAndStatus(userId, "PENDING")).thenReturn(new ArrayList<>());

        AnalyticsDashboardResponse response = analyticsService.getDashboardMetrics(userId);

        assertNotNull(response);
        assertEquals(new BigDecimal("1000.00"), response.currentBalance());
        assertEquals(new BigDecimal("250.00"), response.monthlyIncome());
        assertEquals(new BigDecimal("100.00"), response.monthlyExpense());
        assertEquals(2, response.totalTransactions());
        assertEquals(new BigDecimal("100.00"), response.highestExpense());
        assertEquals(new BigDecimal("250.00"), response.highestIncome());
    }

    @Test
    void getSpendingAnalytics_Success() {
        List<Transaction> txs = new ArrayList<>();
        
        Transaction t1 = new Transaction();
        t1.setAmount(new BigDecimal("50.00"));
        t1.setSenderWallet(wallet);
        t1.setReceiverWallet(otherWallet);
        t1.setCategory("FOOD");
        t1.setPaymentStatus(TransactionStatus.SUCCESS);
        t1.setCreatedAt(LocalDateTime.now());
        txs.add(t1);

        Transaction t2 = new Transaction();
        t2.setAmount(new BigDecimal("80.00"));
        t2.setSenderWallet(wallet);
        t2.setReceiverWallet(otherWallet);
        t2.setCategory("SHOPPING");
        t2.setPaymentStatus(TransactionStatus.SUCCESS);
        t2.setCreatedAt(LocalDateTime.now());
        txs.add(t2);

        when(transactionRepository.findSuccessTransactionsByUserId(userId)).thenReturn(txs);

        SpendingAnalyticsResponse response = analyticsService.getSpendingAnalytics(userId);

        assertNotNull(response);
        assertEquals(new BigDecimal("130.00"), response.monthlySpending());
        assertEquals(new BigDecimal("80.00"), response.highestSpending());
        assertEquals(new BigDecimal("50.00"), response.lowestSpending());
        assertEquals(2, response.categorySpending().size());
        assertEquals("SHOPPING", response.categorySpending().get(0).category());
    }
}
