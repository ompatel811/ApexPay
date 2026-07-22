package com.apexpay.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apexpay.dto.AccountStatementResponse;
import com.apexpay.entity.StatementHistory;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.repository.StatementHistoryRepository;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.impl.ReportServiceImpl;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private StatementHistoryRepository statementHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ReportServiceImpl reportService;

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
    void generateStatement_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));

        List<Transaction> txs = new ArrayList<>();

        // SUCCESS transaction within period
        Transaction t1 = new Transaction();
        t1.setTransactionReference("REF1");
        t1.setAmount(new BigDecimal("100.00"));
        t1.setSenderWallet(wallet);
        t1.setReceiverWallet(otherWallet);
        t1.setCategory("FOOD");
        t1.setTransactionType(TransactionType.TRANSFER);
        t1.setPaymentStatus(TransactionStatus.SUCCESS);
        t1.setCreatedAt(LocalDateTime.now().minusDays(2));
        txs.add(t1);

        // SUCCESS transaction after statement period
        Transaction t2 = new Transaction();
        t2.setTransactionReference("REF2");
        t2.setAmount(new BigDecimal("200.00"));
        t2.setSenderWallet(wallet);
        t2.setReceiverWallet(otherWallet);
        t2.setCategory("BILLS");
        t2.setTransactionType(TransactionType.TRANSFER);
        t2.setPaymentStatus(TransactionStatus.SUCCESS);
        t2.setCreatedAt(LocalDateTime.now().plusDays(2));
        txs.add(t2);

        when(transactionRepository.findSuccessTransactionsByUserId(userId)).thenReturn(txs);
        when(statementHistoryRepository.save(any(StatementHistory.class))).thenAnswer(i -> i.getArgument(0));

        LocalDate start = LocalDate.now().minusDays(5);
        LocalDate end = LocalDate.now();

        AccountStatementResponse response = reportService.generateStatement(userId, start, end);

        assertNotNull(response);
        // Current balance is 1000.00.
        // t2 (200.00 debit) occurred AFTER the end date.
        // Therefore, closingBalance at end date was currentBalance + 200.00 = 1200.00.
        // t1 (100.00 debit) occurred WITHIN period.
        // Therefore, openingBalance at start date was closingBalance + 100.00 = 1300.00.
        assertEquals(new BigDecimal("1300.00"), response.openingBalance());
        assertEquals(new BigDecimal("1200.00"), response.closingBalance());
        assertEquals(new BigDecimal("100.00"), response.debitsSum());
        assertEquals(0, response.creditsSum().compareTo(BigDecimal.ZERO));
        assertEquals(1, response.transactions().size());
        assertEquals("REF1", response.transactions().get(0).transactionReference());

        verify(statementHistoryRepository).save(any(StatementHistory.class));
        verify(auditService).log(eq("ACCOUNT_STATEMENT_GENERATED"), eq(userId), eq("StatementHistory"), any());
    }

    @Test
    void exportTransactions_CsvFormat_ReturnsBytes() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(transactionRepository.findSuccessTransactionsByUserId(userId)).thenReturn(new ArrayList<>());

        byte[] csvBytes = reportService.exportTransactions(userId, "CSV", LocalDate.now().minusDays(10), LocalDate.now());
        
        assertNotNull(csvBytes);
        assertTrue(csvBytes.length > 0);
        String csvContent = new String(csvBytes);
        assertTrue(csvContent.contains("Reference Number,Date,Type,Description,Category,Direction,Amount,Status"));
    }
}
